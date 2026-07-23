import { NextResponse } from "next/server";
import { normaliseOrder, OrderInput, validateOrder } from "../../../lib/orders";

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

  const order = normaliseOrder(input as Required<OrderInput>);
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

  return NextResponse.json({ ok: true });
}
