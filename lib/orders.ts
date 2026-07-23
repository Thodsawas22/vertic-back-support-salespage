import { packages } from "./product";

export type OrderInput = {
  packageId?: string;
  customerName?: string;
  phone?: string;
  addressLine?: string;
  province?: string;
  amphoe?: string;
  district?: string;
  zipcode?: string;
};

type ValidationResult = { valid: true } | { valid: false; errors: Record<string, string> };

export function validateOrder(input: OrderInput): ValidationResult {
  const errors: Record<string, string> = {};
  const phone = (input.phone ?? "").replace(/[\s-]/g, "");

  if (!packages.some((offer) => offer.id === input.packageId)) errors.packageId = "กรุณาเลือกแพ็กเกจ";
  if ((input.customerName ?? "").trim().length < 2) errors.customerName = "กรุณากรอกชื่อผู้รับสินค้า";
  if (!/^0\d{8,9}$/.test(phone)) errors.phone = "กรุณากรอกเบอร์โทรศัพท์ 9–10 หลัก";
  const addressLine = (input.addressLine ?? "").trim();
  if (!addressLine || !/\d/.test(addressLine)) errors.addressLine = "กรุณากรอกที่อยู่จัดส่งให้ครบ";
  if (!(input.province ?? "").trim()) errors.province = "กรุณาเลือกจังหวัด";
  if (!(input.amphoe ?? "").trim()) errors.amphoe = "กรุณาเลือกอำเภอ/เขต";
  if (!(input.district ?? "").trim()) errors.district = "กรุณาเลือกตำบล/แขวง";

  return Object.keys(errors).length ? { valid: false, errors } : { valid: true };
}

export function normaliseOrder(input: Required<OrderInput>) {
  const selected = packages.find((offer) => offer.id === input.packageId)!;
  const fullAddress = [input.addressLine.trim(), input.district, input.amphoe, input.province, input.zipcode].filter(Boolean).join(" ");
  return {
    createdAt: new Date().toISOString(),
    orderStatus: "NEW",
    package: `${selected.quantity} ชิ้น`,
    quantity: selected.quantity,
    amount: selected.price,
    customerName: input.customerName.trim(),
    phone: input.phone.replace(/[\s-]/g, ""),
    addressLine: input.addressLine.trim(),
    district: input.district,
    amphoe: input.amphoe,
    province: input.province,
    zipcode: input.zipcode,
    fullAddress,
  };
}
