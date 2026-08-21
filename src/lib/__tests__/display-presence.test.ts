import { describe, expect, it } from "vitest";
import { addPresenceBaseline, createPresenceBaseline } from "@/lib/display-presence";

describe("createPresenceBaseline", () => {
  it("includes the minimum values", () => {
    expect(createPresenceBaseline(() => 0)).toEqual({ online: 12, lastHour: 44 });
  });

  it("includes the maximum values", () => {
    expect(createPresenceBaseline(() => 0.999999)).toEqual({ online: 20, lastHour: 60 });
  });
});

describe("addPresenceBaseline", () => {
  it("adds the baseline to zero real readers", () => {
    expect(
      addPresenceBaseline({ online: 0, lastHour: 0 }, { online: 12, lastHour: 44 }),
    ).toEqual({ online: 12, lastHour: 44 });
  });

  it("adds the baseline on top of nonzero real readers", () => {
    expect(
      addPresenceBaseline({ online: 7, lastHour: 19 }, { online: 20, lastHour: 60 }),
    ).toEqual({ online: 27, lastHour: 79 });
  });
});
