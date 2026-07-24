import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../app/api/orders/route";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("order API tracking", () => {
  it("generates server-owned order/event IDs and forwards Meta browser identifiers", async () => {
    vi.stubEnv("GOOGLE_SHEETS_WEBHOOK_URL", "https://example.com/webhook");
    vi.stubEnv("GOOGLE_SHEETS_WEBHOOK_SECRET", "test-secret");
    const webhook = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true, row: 4 }), { status: 200 }),
    );

    const request = new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId: "one",
        customerName: "ทดสอบ",
        phone: "0934953555",
        addressLine: "179",
        province: "ขอนแก่น",
        amphoe: "เมืองขอนแก่น",
        district: "สำราญ",
        zipcode: "40000",
        fbp: "fb.1.123.abc",
        fbc: "fb.1.123.click",
      }),
    });

    const response = await POST(request);
    const result = await response.json();
    const forwarded = JSON.parse(String(webhook.mock.calls[0][1]?.body));

    expect(response.status).toBe(200);
    expect(result.orderId).toMatch(/^VRT-/);
    expect(result.eventId).toBe(`purchase-${result.orderId}`);
    expect(forwarded.order).toMatchObject({
      orderId: result.orderId,
      eventId: result.eventId,
      fbp: "fb.1.123.abc",
      fbc: "fb.1.123.click",
      orderStatus: "NEW",
    });
  });
});
