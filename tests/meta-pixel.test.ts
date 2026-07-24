// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { getMetaBrowserIdentifiers, META_PIXEL_ID, trackMetaEvent } from "../lib/meta-pixel";

afterEach(() => {
  delete window.fbq;
  document.cookie = "_fbp=; Max-Age=0; path=/";
  document.cookie = "_fbc=; Max-Age=0; path=/";
});

describe("Meta Pixel", () => {
  it("uses the configured VERTIC dataset ID", () => {
    expect(META_PIXEL_ID).toBe("1595122382217844");
  });

  it("forwards an event ID for future browser/server deduplication", () => {
    window.fbq = vi.fn();

    trackMetaEvent("Lead", { currency: "THB", value: 1990 }, "lead-VRT-123");

    expect(window.fbq).toHaveBeenCalledWith(
      "track",
      "Lead",
      { currency: "THB", value: 1990 },
      { eventID: "lead-VRT-123" },
    );
  });

  it("collects Meta browser identifiers without sending customer details to the client event", () => {
    document.cookie = "_fbp=fb.1.123.abc; path=/";
    document.cookie = "_fbc=fb.1.123.click; path=/";

    expect(getMetaBrowserIdentifiers()).toEqual({
      fbp: "fb.1.123.abc",
      fbc: "fb.1.123.click",
    });
  });
});
