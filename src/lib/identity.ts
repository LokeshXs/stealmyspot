/**
 * Turns free-text input ("trycomp.ai", "https://x.com/foo?utm=1", "@foo") into a
 * stable identity key, and enforces the listing rules from /rules.
 *
 * Pure except for `resolveShortener`, which is injected so the parser stays testable.
 */

import { IdentityType } from "@/generated/prisma/enums";

/** Hosts whose *path* is part of the identity — different apps must not share a bid. */
const PATH_KEYED_HOSTS = new Set([
  "apps.apple.com",
  "itunes.apple.com",
  "testflight.apple.com",
  "play.google.com",
  "github.com",
  "gitlab.com",
  "chromewebstore.google.com",
  "chrome.google.com",
  "addons.mozilla.org",
  "marketplace.visualstudio.com",
  "producthunt.com",
  "npmjs.com",
  "steampowered.com",
  "store.steampowered.com",
]);

/** Chat and invite links — the board is for products and profiles, not group chats. */
const CHAT_HOSTS = new Set([
  "t.me",
  "telegram.me",
  "telegram.org",
  "wa.me",
  "whatsapp.com",
  "chat.whatsapp.com",
  "api.whatsapp.com",
  "discord.gg",
  "discord.com",
  "discordapp.com",
  "m.me",
  "messenger.com",
  "signal.group",
  "signal.me",
  "join.skype.com",
  "line.me",
  "kakao.com",
  "wechat.com",
]);

const SHORTENER_HOSTS = new Set([
  "bit.ly",
  "t.co",
  "tinyurl.com",
  "goo.gl",
  "lnkd.in",
  "buff.ly",
  "rebrand.ly",
  "short.io",
  "shorturl.at",
  "is.gd",
  "ow.ly",
  "cutt.ly",
  "rb.gy",
  "s.id",
  "bl.ink",
  "tiny.cc",
  "trib.al",
  "dub.sh",
  "dub.co",
  "shp.ee",
]);

const ADULT_HOSTS = new Set([
  "pornhub.com",
  "xvideos.com",
  "xhamster.com",
  "redtube.com",
  "youporn.com",
  "onlyfans.com",
  "fansly.com",
  "chaturbate.com",
  "stripchat.com",
  "brazzers.com",
  "xnxx.com",
  "spankbang.com",
  "manyvids.com",
  "adultfriendfinder.com",
]);

const ADULT_KEYWORDS = ["porn", "xxx", "nsfw", "camgirl", "escort", "hentai", "sexcam"];

const X_HOSTS = new Set(["x.com", "twitter.com", "mobile.twitter.com", "www.x.com"]);

/** X reserves these paths — they're pages, not handles. */
const X_RESERVED = new Set([
  "home",
  "explore",
  "notifications",
  "messages",
  "settings",
  "search",
  "i",
  "intent",
  "compose",
  "login",
  "signup",
  "tos",
  "privacy",
  "about",
  "share",
]);

export type IdentityErrorCode =
  | "empty"
  | "unparseable"
  | "chat_link"
  | "adult_content"
  | "invalid_handle"
  | "unsupported_scheme"
  | "shortener_unresolved";

export interface NormalizedIdentity {
  identityType: IdentityType;
  /** "website:example.com" | "x:handle" */
  identityKey: string;
  /** The canonical URL clicks are sent to — query params already stripped. */
  sourceUrl: string;
  /** Host for websites, "@handle" for X. Used as the row label before scraping. */
  label: string;
}

export type IdentityResult =
  | { ok: true; identity: NormalizedIdentity }
  | { ok: false; error: IdentityErrorCode; message: string };

const ERROR_MESSAGES: Record<IdentityErrorCode, string> = {
  empty: "Enter a product URL or an @handle.",
  unparseable: "That doesn't look like a valid URL or @handle.",
  chat_link:
    "Chat and invite links aren't allowed — the board is for products and profiles, not group chats.",
  adult_content: "Links to sexual content aren't allowed on the board.",
  invalid_handle: "That X handle looks wrong. Handles are 1–15 letters, numbers or underscores.",
  unsupported_scheme: "Only http and https links are allowed.",
  shortener_unresolved:
    "Link shorteners aren't allowed and this one couldn't be resolved. Submit the destination URL.",
};

function fail(error: IdentityErrorCode): IdentityResult {
  return { ok: false, error, message: ERROR_MESSAGES[error] };
}

function stripWww(host: string): string {
  return host.startsWith("www.") ? host.slice(4) : host;
}

function isAdult(host: string, pathname: string): boolean {
  const bare = stripWww(host);
  if (ADULT_HOSTS.has(bare)) return true;
  const haystack = `${bare}${pathname}`.toLowerCase();
  return ADULT_KEYWORDS.some((word) => haystack.includes(word));
}

export function isShortenerHost(host: string): boolean {
  return SHORTENER_HOSTS.has(stripWww(host));
}

function validHandle(handle: string): boolean {
  return /^[A-Za-z0-9_]{1,15}$/.test(handle);
}

function xIdentity(handleRaw: string): IdentityResult {
  const handle = handleRaw.replace(/^@/, "").trim();
  if (!validHandle(handle)) return fail("invalid_handle");
  if (X_RESERVED.has(handle.toLowerCase())) return fail("invalid_handle");
  const lower = handle.toLowerCase();
  return {
    ok: true,
    identity: {
      identityType: IdentityType.X,
      identityKey: `x:${lower}`,
      sourceUrl: `https://x.com/${handle}`,
      label: `@${handle}`,
    },
  };
}

/**
 * Parses input into a URL, tolerating the scheme-less form people actually type.
 * Returns null when the input can't be a website.
 */
function toUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  // A bare word like "hello" parses as a URL but isn't a host.
  if (!url.hostname.includes(".")) return null;
  if (/\s/.test(url.hostname)) return null;
  return url;
}

/**
 * The synchronous half of normalization. Callers that want shortener resolution
 * should use `normalizeIdentity`, which wraps this.
 */
export function normalizeIdentitySync(input: string): IdentityResult {
  const raw = input.trim();
  if (!raw) return fail("empty");

  // Bare @handle
  if (raw.startsWith("@")) return xIdentity(raw);

  const url = toUrl(raw);
  if (!url) {
    // Someone may have typed a naked handle with no @ and no dot.
    if (validHandle(raw)) return xIdentity(raw);
    return fail("unparseable");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return fail("unsupported_scheme");
  }

  const host = stripWww(url.hostname.toLowerCase());
  const segments = url.pathname.split("/").filter(Boolean);

  if (X_HOSTS.has(host) || X_HOSTS.has(url.hostname.toLowerCase())) {
    const first = segments[0];
    if (!first) return fail("invalid_handle");
    return xIdentity(first);
  }

  if (CHAT_HOSTS.has(host)) return fail("chat_link");
  if (isAdult(host, url.pathname)) return fail("adult_content");

  // Query params, hashes and tracking strings never survive.
  const keepPath = PATH_KEYED_HOSTS.has(host);
  const path = keepPath ? `/${segments.join("/")}` : "";
  const cleanPath = path === "/" ? "" : path;

  const identityKey = `website:${host}${cleanPath}`;
  const sourceUrl = `https://${host}${cleanPath}${cleanPath ? "" : "/"}`;

  return {
    ok: true,
    identity: {
      identityType: IdentityType.WEBSITE,
      identityKey,
      sourceUrl,
      label: `${host}${cleanPath}`,
    },
  };
}

export type ShortenerResolver = (url: string) => Promise<string | null>;

/**
 * Full normalization. Shorteners are replaced by whatever they redirect to,
 * then re-normalized (so `bit.ly/x` → `t.me/y` is still rejected as a chat link).
 */
export async function normalizeIdentity(
  input: string,
  resolveShortener?: ShortenerResolver,
): Promise<IdentityResult> {
  const first = normalizeIdentitySync(input);
  if (!first.ok) return first;
  if (first.identity.identityType !== IdentityType.WEBSITE) return first;

  const host = first.identity.identityKey.replace(/^website:/, "").split("/")[0];
  if (!isShortenerHost(host)) return first;

  if (!resolveShortener) return fail("shortener_unresolved");

  // Resolve against the *original* input so the shortener's path survives.
  const target = await resolveShortener(input.trim());
  if (!target) return fail("shortener_unresolved");

  const resolved = normalizeIdentitySync(target);
  if (!resolved.ok) return resolved;

  // Guard against a shortener that redirects to another shortener.
  const resolvedHost = resolved.identity.identityKey
    .replace(/^website:/, "")
    .split("/")[0];
  if (isShortenerHost(resolvedHost)) return fail("shortener_unresolved");

  return resolved;
}

/** Renders an identityKey back as a human label: "x:foo" -> "@foo". */
export function labelForKey(identityKey: string): string {
  const [type, ...rest] = identityKey.split(":");
  const value = rest.join(":");
  return type === "x" ? `@${value}` : value;
}

/** First letter for the fallback avatar, matching the original's letter tiles. */
export function initialFor(label: string): string {
  const cleaned = label.replace(/^@/, "");
  return (cleaned[0] ?? "?").toUpperCase();
}
