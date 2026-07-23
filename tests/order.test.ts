import { describe, expect, it } from "vitest";
import { validateOrder } from "../lib/orders";

describe("order validation", () => {
  it("accepts a complete Thai COD order with structured delivery location", () => {
    expect(
      validateOrder({
        packageId: "two",
        customerName: "สมชาย ใจดี",
        phone: "0812345678",
        addressLine: "99 ถนนสุขุมวิท ห้อง 5A",
        province: "กรุงเทพมหานคร",
        amphoe: "วัฒนา",
        district: "คลองตันเหนือ",
        zipcode: "10110",
      }),
    ).toEqual({ valid: true });
  });

  it("accepts a concise rural Thai address when structured location fields are complete", () => {
    expect(
      validateOrder({
        packageId: "one",
        customerName: "ทดสอบ ทดสอบ",
        phone: "0934953555",
        addressLine: "179",
        province: "ขอนแก่น",
        amphoe: "เมืองขอนแก่น",
        district: "สำราญ",
        zipcode: "40000",
      }),
    ).toEqual({ valid: true });
  });

  it("rejects a malformed phone number and incomplete structured address", () => {
    expect(
      validateOrder({ packageId: "one", customerName: "สมชาย", phone: "123", addressLine: "บ้าน", province: "", amphoe: "", district: "", zipcode: "" }),
    ).toEqual({
      valid: false,
      errors: {
        phone: "กรุณากรอกเบอร์โทรศัพท์ 9–10 หลัก",
        addressLine: "กรุณากรอกที่อยู่จัดส่งให้ครบ",
        province: "กรุณาเลือกจังหวัด",
        amphoe: "กรุณาเลือกอำเภอ/เขต",
        district: "กรุณาเลือกตำบล/แขวง",
      },
    });
  });
});
