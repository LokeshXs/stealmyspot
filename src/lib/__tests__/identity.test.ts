import { describe, expect, it } from "vitest";
import { initialFor, isShortenerHost, normalizeIdentity, normalizeIdentitySync } from "../identity";

function key(input: string): string {
  const result = normalizeIdentitySync(input);
  if (!result.ok) throw new Error(`expected ok, got ${result.error}`);
  return result.identity.identityKey;
}

describe("website normalization", () => {
  it("strips tracking query strings", () => {
    expect(key("https://ex.com/?utm_source=x")).toBe("website:ex.com");
    expect(key("https://ex.com/?ref=abc&fbclid=123")).toBe("website:ex.com");
  });

  it("strips the hash", () => {
    expect(key("https://ex.com/#pricing")).toBe("website:ex.com");
  });

  it("drops www and lowercases the host", () => {
    expect(key("https://WWW.Ex.COM")).toBe("website:ex.com");
  });

  it("accepts a scheme-less host", () => {
    expect(key("trycomp.ai")).toBe("website:trycomp.ai");
  });

  it("collapses different paths on a normal host to one identity", () => {
    expect(key("https://ex.com/pricing")).toBe("website:ex.com");
    expect(key("https://ex.com/about")).toBe("website:ex.com");
  });

  it("produces a clean sourceUrl", () => {
    const result = normalizeIdentitySync("https://ex.com/pricing?utm_source=outbid");
    if (!result.ok) throw new Error("expected ok");
    expect(result.identity.sourceUrl).toBe("https://ex.com/");
  });

  it("keeps subdomains distinct", () => {
    expect(key("https://app.ex.com")).toBe("website:app.ex.com");
    expect(key("https://ex.com")).toBe("website:ex.com");
  });
});

describe("path-keyed platforms", () => {
  it("keeps the repo path on github", () => {
    expect(key("github.com/a/b?tab=readme")).toBe("website:github.com/a/b");
  });

  it("gives two apps separate identities on the app store", () => {
    expect(key("https://apps.apple.com/us/app/one/id123")).not.toBe(
      key("https://apps.apple.com/us/app/two/id456"),
    );
  });

  it("keeps the package path on play store", () => {
    expect(key("https://play.google.com/store/apps/details?id=com.foo")).toBe(
      "website:play.google.com/store/apps/details",
    );
  });

  it("round-trips a path-keyed sourceUrl", () => {
    const result = normalizeIdentitySync("github.com/a/b");
    if (!result.ok) throw new Error("expected ok");
    expect(result.identity.sourceUrl).toBe("https://github.com/a/b");
  });
});

describe("X handles", () => {
  it("lowercases a bare handle", () => {
    expect(key("@Foo")).toBe("x:foo");
  });

  it("accepts an x.com profile url", () => {
    expect(key("https://x.com/Foo")).toBe("x:foo");
  });

  it("treats twitter.com as the same identity", () => {
    expect(key("https://twitter.com/foo")).toBe("x:foo");
    expect(key("https://twitter.com/foo")).toBe(key("@foo"));
  });

  it("strips query params from a profile url", () => {
    expect(key("https://x.com/foo?s=20")).toBe("x:foo");
  });

  it("preserves original casing in the outbound link", () => {
    const result = normalizeIdentitySync("@FooBar");
    if (!result.ok) throw new Error("expected ok");
    expect(result.identity.sourceUrl).toBe("https://x.com/FooBar");
    expect(result.identity.label).toBe("@FooBar");
  });

  it("rejects an over-long handle", () => {
    const result = normalizeIdentitySync("@abcdefghijklmnopqrstuvwxyz");
    expect(result.ok).toBe(false);
  });

  it("rejects reserved x paths", () => {
    expect(normalizeIdentitySync("https://x.com/home").ok).toBe(false);
    expect(normalizeIdentitySync("https://x.com/i/flow/login").ok).toBe(false);
  });
});

describe("blocked listings", () => {
  it("rejects telegram", () => {
    const result = normalizeIdentitySync("https://t.me/somegroup");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("chat_link");
  });

  it("rejects discord invites", () => {
    expect(normalizeIdentitySync("https://discord.gg/abc").ok).toBe(false);
  });

  it("rejects whatsapp", () => {
    expect(normalizeIdentitySync("https://wa.me/1555").ok).toBe(false);
  });

  it("rejects adult domains", () => {
    const result = normalizeIdentitySync("https://pornhub.com");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("adult_content");
  });

  it("rejects adult keywords in the host", () => {
    expect(normalizeIdentitySync("https://freexxxcams.net").ok).toBe(false);
  });

  it("rejects non-http schemes", () => {
    const result = normalizeIdentitySync("ftp://ex.com");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("unsupported_scheme");
  });

  it("rejects empty input", () => {
    expect(normalizeIdentitySync("   ").ok).toBe(false);
  });

  it("rejects gibberish with no dot", () => {
    expect(normalizeIdentitySync("this is not a url").ok).toBe(false);
  });
});

describe("shorteners", () => {
  it("is detected by host", () => {
    expect(isShortenerHost("bit.ly")).toBe(true);
    expect(isShortenerHost("www.bit.ly")).toBe(true);
    expect(isShortenerHost("ex.com")).toBe(false);
  });

  it("is replaced by its destination", async () => {
    const result = await normalizeIdentity("https://bit.ly/xyz", async () => "https://real.com/page");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.identity.identityKey).toBe("website:real.com");
  });

  it("is rejected when it cannot be resolved", async () => {
    const result = await normalizeIdentity("https://bit.ly/xyz", async () => null);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("shortener_unresolved");
  });

  it("is rejected when no resolver is available", async () => {
    const result = await normalizeIdentity("https://bit.ly/xyz");
    expect(result.ok).toBe(false);
  });

  it("still enforces the rules on the destination", async () => {
    const result = await normalizeIdentity("https://bit.ly/xyz", async () => "https://t.me/group");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("chat_link");
  });

  it("refuses a shortener that points at another shortener", async () => {
    const result = await normalizeIdentity("https://bit.ly/xyz", async () => "https://tinyurl.com/abc");
    expect(result.ok).toBe(false);
  });

  it("leaves normal urls untouched", async () => {
    const result = await normalizeIdentity("https://ex.com", async () => {
      throw new Error("resolver should not be called");
    });
    expect(result.ok).toBe(true);
  });
});

describe("initialFor", () => {
  it("uses the first letter of a host", () => {
    expect(initialFor("trycomp.ai")).toBe("T");
  });

  it("skips the @ on a handle", () => {
    expect(initialFor("@foo")).toBe("F");
  });
});
