import type { Metadata } from "next";
import Script from "next/script";
import { META_PIXEL_ID } from "../lib/meta-pixel";
import "./globals.css";

export const metadata: Metadata = {
  title: "เข็มขัดพยุงหลังและเอว | ส่งฟรี เก็บเงินปลายทาง",
  description: "อุปกรณ์ช่วยพยุงหลังและเอวสำหรับกิจวัตรประจำวัน",
};

const metaPixelCode = `
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${META_PIXEL_ID}');
  fbq('track', 'PageView');
  fbq('track', 'ViewContent', {
    content_ids: ['vertic-back-support'],
    content_name: 'VERTIC Back Support',
    content_type: 'product',
    currency: 'THB',
    value: 1990
  });
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <Script id="meta-pixel" strategy="afterInteractive">{metaPixelCode}</Script>
        <noscript>
          <img
            alt=""
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
