// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SalesPage from "../components/SalesPage";

afterEach(cleanup);

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

  it("uses all nine supplied images in sales-funnel sequence and floats an order CTA to the form", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    render(<SalesPage />);

    expect(screen.getAllByAltText(/Sales funnel image/i)).toHaveLength(9);
    fireEvent.click(screen.getByRole("button", { name: /สั่งซื้อเลย/i }));
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("collects structured Thai delivery details", () => {
    render(<SalesPage />);
    expect(screen.getByLabelText("ชื่อ-นามสกุล")).toBeInTheDocument();
    expect(screen.getByLabelText("เบอร์โทร")).toBeInTheDocument();
    expect(screen.getByLabelText("ที่อยู่ (เช่น เลขที่บ้าน ห้อง)")).toBeInTheDocument();
    expect(screen.getByLabelText("จังหวัด")).toBeInTheDocument();
    expect(screen.getByLabelText("อำเภอ/เขต")).toBeInTheDocument();
    expect(screen.getByLabelText("ตำบล/แขวง")).toBeInTheDocument();
  });
});
