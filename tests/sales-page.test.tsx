// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SalesPage from "../components/SalesPage";
import rawAddressDatabase from "../public/thai-address-db.json";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete window.fbq;
  document.cookie = "_fbp=; Max-Age=0; path=/";
  document.cookie = "_fbc=; Max-Age=0; path=/";
});

describe("back support sales page", () => {
  it("shows the COD offer, clear package choices, and factual everyday-use messaging", () => {
    render(<SalesPage />);

    expect(screen.getByRole("heading", { name: /ระบบพยุงหลัง.*ปรับแรงกระชับได้ตามคุณ/i })).toBeInTheDocument();
    expect(screen.getAllByText("฿1,990").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ส่งฟรี.*เก็บเงินปลายทาง/i).length).toBeGreaterThan(0);
    expect(screen.getByText("1 ชิ้น")).toBeInTheDocument();
    expect(screen.getByText("2 ชิ้น")).toBeInTheDocument();
    expect(screen.getByText("3 ชิ้น")).toBeInTheDocument();
    expect(screen.getByText(/ผสานโครงสร้างพยุง 4 จุดเข้ากับระบบดึงปรับแรงแบบคู่/i)).toBeInTheDocument();
  });

  it("uses all nine supplied images and tracks the first order CTA as checkout intent", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    window.fbq = vi.fn();
    render(<SalesPage />);

    expect(screen.getAllByAltText(/Sales funnel image/i)).toHaveLength(9);
    fireEvent.click(screen.getByRole("button", { name: /สั่งซื้อเลย/i }));
    expect(scrollIntoView).toHaveBeenCalled();
    expect(window.fbq).toHaveBeenCalledWith("track", "InitiateCheckout", {
      content_ids: ["vertic-back-support"],
      content_type: "product",
      currency: "THB",
      value: 1990,
    });
  });

  it("collects structured Thai delivery details", () => {
    render(<SalesPage />);
    expect(screen.getByLabelText("ชื่อผู้รับสินค้า")).toBeInTheDocument();
    expect(screen.getByLabelText("เบอร์โทร")).toBeInTheDocument();
    expect(screen.getByLabelText("ที่อยู่ (เช่น เลขที่บ้าน ห้อง)")).toBeInTheDocument();
    expect(screen.getByLabelText("จังหวัด")).toBeInTheDocument();
    expect(screen.getByLabelText("อำเภอ/เขต")).toBeInTheDocument();
    expect(screen.getByLabelText("ตำบล/แขวง")).toBeInTheDocument();
  });

  it("marks each incomplete or invalid field with an inline error", () => {
    render(<SalesPage />);

    fireEvent.change(screen.getByLabelText("ชื่อผู้รับสินค้า"), { target: { value: "ทดสอบ" } });
    fireEvent.change(screen.getByLabelText("เบอร์โทร"), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText("ที่อยู่ (เช่น เลขที่บ้าน ห้อง)"), { target: { value: "บ้าน" } });
    fireEvent.submit(screen.getByRole("button", { name: /ยืนยันการสั่งซื้อ/i }).closest("form")!);

    expect(screen.getByLabelText("ชื่อผู้รับสินค้า")).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByLabelText("เบอร์โทร")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("ที่อยู่ (เช่น เลขที่บ้าน ห้อง)")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("จังหวัด")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("กรุณากรอกเบอร์โทรศัพท์ 9–10 หลัก")).toBeInTheDocument();
    expect(screen.getByText("กรุณาเลือกจังหวัด")).toBeInTheDocument();
  });

  it("confirms a successful COD order and tracks it as a browser Purchase", async () => {
    window.fbq = vi.fn();
    document.cookie = "_fbp=fb.1.123.abc; path=/";
    document.cookie = "_fbc=fb.1.123.click; path=/";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).includes("thai-address-db.json")) {
        return new Response(JSON.stringify(rawAddressDatabase), { status: 200 });
      }
      return new Response(
        JSON.stringify({ ok: true, orderId: "VRT-TEST", eventId: "purchase-VRT-TEST" }),
        { status: 200 },
      );
    });

    render(<SalesPage />);
    await waitFor(() => expect(screen.getByRole("option", { name: "ขอนแก่น" })).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText("ชื่อผู้รับสินค้า"), { target: { value: "ทดสอบ" } });
    fireEvent.change(screen.getByLabelText("เบอร์โทร"), { target: { value: "0934953555" } });
    fireEvent.change(screen.getByLabelText("ที่อยู่ (เช่น เลขที่บ้าน ห้อง)"), { target: { value: "179" } });
    fireEvent.change(screen.getByLabelText("จังหวัด"), { target: { value: "ขอนแก่น" } });
    fireEvent.change(screen.getByLabelText("อำเภอ/เขต"), { target: { value: "เมืองขอนแก่น" } });
    fireEvent.change(screen.getByLabelText("ตำบล/แขวง"), { target: { value: "สำราญ" } });
    fireEvent.submit(screen.getByRole("button", { name: /ยืนยันการสั่งซื้อ/i }).closest("form")!);

    const dialog = await screen.findByRole("dialog", { name: /รับออเดอร์เรียบร้อย/i });
    expect(dialog).toHaveTextContent("1 ชิ้น");
    expect(dialog).toHaveTextContent("฿1,990");
    expect(dialog).toHaveTextContent("0934953555");
    expect(within(dialog).getByText(/179 สำราญ เมืองขอนแก่น ขอนแก่น 40000/)).toBeInTheDocument();
    const orderCall = fetchMock.mock.calls.find(([input]) => String(input) === "/api/orders");
    const submitted = JSON.parse(String(orderCall?.[1]?.body));
    expect(submitted).toMatchObject({ fbp: "fb.1.123.abc", fbc: "fb.1.123.click" });
    expect(window.fbq).toHaveBeenCalledWith("track", "Purchase", {
      content_ids: ["vertic-back-support"],
      content_name: "VERTIC Back Support",
      content_type: "product",
      currency: "THB",
      num_items: 1,
      value: 1990,
    }, { eventID: "purchase-VRT-TEST" });
  });
});
