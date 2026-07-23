import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "เข็มขัดพยุงหลังและเอว | ส่งฟรี เก็บเงินปลายทาง",
  description: "อุปกรณ์ช่วยพยุงหลังและเอวสำหรับกิจวัตรประจำวัน",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
