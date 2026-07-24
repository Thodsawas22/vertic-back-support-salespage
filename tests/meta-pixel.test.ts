// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { META_PIXEL_ID, trackMetaEvent } from "../lib/meta-pixel";

afterEach(() => {
  delete window.fbq;
});

describe("Meta Pixel", () => {
  it("uses the configured VERTIC dataset ID", () => {
    expect(META_PIXEL_ID).toBe("1595122382217844");
  });

  it("forwards standard events and parameters to fbq", () => {
    window.fbq = vi.fn();

    trackMetaEvent("Lead", { currency: "THB", value: 1990 });

    expect(window.fbq).toHaveBeenCalledWith("track", "Lead", { currency: "THB", value: 1990 });
  });
});
