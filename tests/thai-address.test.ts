import { describe, expect, it } from "vitest";
import rawDatabase from "../public/thai-address-db.json";
import { decodeThaiAddress, districtsForProvince, subdistrictsForDistrict } from "../lib/thai-address";

const addressData = decodeThaiAddress(rawDatabase);

describe("Thai address lookup", () => {
  it("narrows districts and subdistricts from the selected location", () => {
    expect(addressData.some((item) => item.province === "กรุงเทพมหานคร")).toBe(true);
    expect(districtsForProvince(addressData, "กรุงเทพมหานคร")).toContain("วัฒนา");
    expect(subdistrictsForDistrict(addressData, "กรุงเทพมหานคร", "วัฒนา")).toContain("คลองตันเหนือ");
  });
});
