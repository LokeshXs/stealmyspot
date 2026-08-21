import "server-only";

import dns from "node:dns/promises";
import net from "node:net";

import { appUrl, branding } from "@/lib/env";

/**
 * Fetches a submitted URL and pulls out the title, description and site logo we
 * show on the board.
 *
 * This is the one place the server follows a user-supplied URL, so it is also the
 * one place that needs an SSRF guard: every hop is re-resolved and checked against
 * private address space before we connect.
 */

const TIMEOUT_MS = 5_000;
const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;
/**
 * Derived from the brand so the bot introduces itself honestly to every site it
 * fetches. Site owners read this in their logs; a stale name here is a stale
 * name on someone else's server.
 */
const USER_AGENT = `Mozilla/5.0 (compatible; ${branding.name.replace(/\s+/g, "")}Bot/1.0; +${appUrl}) AppleWebKit/537.36`;

export interface ScrapedMetadata {
  displayName: string | null;
  description: string | null;
  imageUrl: string | null;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast + reserved
    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    // IPv4-mapped (::ffff:10.0.0.1) — unwrap and re-check.
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }

  return true;
}

/** Rejects anything that resolves into private address space. */
async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`Refusing non-http(s) scheme: ${url.protocol}`);
  }

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new Error(`Refusing internal host: ${host}`);
  }

  // A literal IP never reaches DNS, so check it directly.
  const literal = host.replace(/^\[|\]$/g, "");
  if (net.isIP(literal)) {
    if (isPrivateIp(literal)) throw new Error(`Refusing private address: ${literal}`);
    return;
  }

  const records = await dns.lookup(host, { all: true });
  if (records.length === 0) throw new Error(`Could not resolve ${host}`);
  for (const record of records) {
    if (isPrivateIp(record.address)) {
      throw new Error(`Refusing host resolving to private address: ${host}`);
    }
  }
}

/**
 * Fetch with manual redirect handling so every hop gets the SSRF check —
 * `redirect: "follow"` would let hop 2 land somewhere hop 1 was not allowed to.
 */
async function safeFetch(
  startUrl: string,
  init: RequestInit = {},
): Promise<{ response: Response; finalUrl: string }> {
  let current = new URL(startUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(current, {
        ...init,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml",
          ...(init.headers ?? {}),
        },
      });
    } finally {
      clearTimeout(timer);
    }

    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current);
      continue;
    }

    return { response, finalUrl: current.toString() };
  }

  throw new Error("Too many redirects");
}

/** Reads at most MAX_BYTES so a hostile server can't stream us to death. */
async function readCapped(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let total = 0;

  try {
    while (total < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      chunks.push(decoder.decode(value, { stream: true }));
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  return chunks.join("");
}

function decodeEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

function clean(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const text = decodeEntities(value).replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Pulls `content` off whichever meta tag matches, attribute order be damned. */
function metaContent(html: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)\\s*=\\s*["']${escaped}["'][^>]*content\\s*=\\s*["']([^"']*)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]*(?:property|name)\\s*=\\s*["']${escaped}["']`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return match[1];
    }
  }
  return null;
}

/** Finds a linked icon regardless of whether `rel` or `href` comes first. */
function linkedIcon(html: string): string | null {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  let favicon: string | null = null;

  for (const link of links) {
    const rel = link.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    const href = link.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!rel || !href) continue;

    const relTokens = new Set(rel.split(/\s+/));
    if (relTokens.has("apple-touch-icon")) return href;
    if (!favicon && relTokens.has("icon")) favicon = href;
  }

  return favicon;
}

function extractLogo(html: string, baseUrl: string): string | null {
  const candidate = linkedIcon(html) ?? "/favicon.ico";
  try {
    const resolved = new URL(decodeEntities(candidate), baseUrl);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

/**
 * Best-effort scrape. Never throws — a listing whose site is down still goes live
 * with its hostname as the label.
 */
export async function scrapeMetadata(url: string): Promise<ScrapedMetadata> {
  const empty: ScrapedMetadata = { displayName: null, description: null, imageUrl: null };

  try {
    const { response, finalUrl } = await safeFetch(url);
    if (!response.ok) return empty;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("html") && contentType !== "") return empty;

    const html = await readCapped(response);

    return {
      displayName: clean(
        metaContent(html, ["og:title", "twitter:title"]) ??
          html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1],
        120,
      ),
      description: clean(
        metaContent(html, ["og:description", "twitter:description", "description"]),
        280,
      ),
      imageUrl: extractLogo(html, finalUrl),
    };
  } catch {
    return empty;
  }
}

/**
 * Follows a shortener to its destination. Used by `normalizeIdentity`;
 * returns null when the link is dead or points somewhere we refuse to go.
 */
export async function resolveRedirect(url: string): Promise<string | null> {
  try {
    const { finalUrl } = await safeFetch(url, { method: "GET" });
    return finalUrl;
  } catch {
    return null;
  }
}
