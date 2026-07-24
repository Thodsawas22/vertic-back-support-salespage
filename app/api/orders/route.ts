import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { normaliseOrder, OrderInput, validateOrder } from "../../../lib/orders";

function cleanMetaBrowserId(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 255) : "";
}

function createOrderId() {
  const time = Date.now().toString(36).toUpperCase();
  const random = randomUUID().split("-")[0].toUpperCase();
  return `VRT-${time}-${random}`;
}

export async function POST(request: Request) {
  let input: OrderInput;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ message: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const validation = validateOrder(input);
  if (!validation.valid) return NextResponse.json({ message: "กรุณาตรวจข้อมูลให้ครบ", errors: validation.errors }, { status: 400 });

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) return NextResponse.json({ message: "ระบบรับออเดอร์ยังไม่ได้เชื่อมต่อ Google Sheets" }, { status: 503 });

  const orderId = createOrderId();
  const eventId = `lead-${orderId}`;
  const order = {
    ...normaliseOrder(input as Required<OrderInput>),
    orderId,
    eventId,
    fbp: cleanMetaBrowserId(input.fbp),
    fbc: cleanMetaBrowserId(input.fbc),
  };
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret: process.env.GOOGLE_SHEETS_WEBHOOK_SECRET ?? "", order }),
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      throw new Error(result?.error ?? `Google Sheets webhook returned ${response.status}`);
    }
  } catch {
    return NextResponse.json({ message: "บันทึกออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, orderId, eventId });
}
