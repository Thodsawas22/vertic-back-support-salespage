"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { formatBaht, packages } from "../lib/product";
import { validateOrder } from "../lib/orders";
import { getMetaBrowserIdentifiers, trackMetaEvent } from "../lib/meta-pixel";
import {
  decodeThaiAddress,
  districtsForProvince,
  provinces,
  subdistrictsForDistrict,
  ThaiAddress,
  zipcodeForAddress,
} from "../lib/thai-address";

const funnelImages = Array.from({ length: 9 }, (_, index) => `/products/${index + 1}.png`);

type OrderConfirmation = {
  customerName: string;
  phone: string;
  deliveryAddress: string;
  quantity: number;
  amount: number;
};

export default function SalesPage() {
  const orderRef = useRef<HTMLElement>(null);
  const checkoutTracked = useRef(false);
  const [packageId, setPackageId] = useState("one");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [province, setProvince] = useState("");
  const [amphoe, setAmphoe] = useState("");
  const [district, setDistrict] = useState("");
  const [addressData, setAddressData] = useState<ThaiAddress[]>([]);
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  useEffect(() => {
    fetch("/thai-address-db.json")
      .then((response) => response.json())
      .then((database) => setAddressData(decodeThaiAddress(database)))
      .catch(() => setNotice("ไม่สามารถโหลดข้อมูลพื้นที่จัดส่งได้ กรุณารีเฟรชหน้าเว็บ"));
  }, []);

  const selected = packages.find((offer) => offer.id === packageId) ?? packages[0];
  const provinceOptions = useMemo(() => provinces(addressData), [addressData]);
  const amphoeOptions = useMemo(
    () => districtsForProvince(addressData, province),
    [addressData, province],
  );
  const districtOptions = useMemo(
    () => subdistrictsForDistrict(addressData, province, amphoe),
    [addressData, province, amphoe],
  );
  const zipcode = useMemo(
    () => zipcodeForAddress(addressData, province, amphoe, district),
    [addressData, province, amphoe, district],
  );

  const scrollToOrder = () => {
    if (!checkoutTracked.current) {
      trackMetaEvent("InitiateCheckout", {
        content_ids: ["vertic-back-support"],
        content_type: "product",
        currency: "THB",
        value: selected.price,
      });
      checkoutTracked.current = true;
    }
    orderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");

    const payload = {
      packageId,
      customerName,
      phone,
      addressLine,
      province,
      amphoe,
      district,
      zipcode,
      ...getMetaBrowserIdentifiers(),
    };
    const validation = validateOrder(payload);

    if (!validation.valid) {
      setFieldErrors(validation.errors);
      setNotice("กรุณาตรวจสอบช่องที่แสดงเป็นสีแดง");
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setFieldErrors(result.errors ?? {});
        setNotice(result.message ?? "ยังบันทึกคำสั่งซื้อไม่ได้ กรุณาตรวจข้อมูลอีกครั้ง");
        return;
      }

      trackMetaEvent("Lead", {
        content_ids: ["vertic-back-support"],
        content_name: "VERTIC Back Support",
        content_type: "product",
        currency: "THB",
        value: selected.price,
      }, result.eventId);
      setConfirmation({
        customerName: customerName.trim(),
        phone: phone.trim(),
        deliveryAddress: [addressLine.trim(), district, amphoe, province, zipcode].filter(Boolean).join(" "),
        quantity: selected.quantity,
        amount: selected.price,
      });
      setCustomerName("");
      setPhone("");
      setAddressLine("");
      setProvince("");
      setAmphoe("");
      setDistrict("");
    } catch {
      setNotice("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <div className="promo-bar">
        <span className="promo-dot" aria-hidden="true" />
        <span>โปรวันนี้</span>
        <strong>{formatBaht(selected.price)}</strong>
        <span>ส่งฟรี · เก็บเงินปลายทาง</span>
      </div>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="brand-lockup">
              <img src="/brand/vertic-logo.png" alt="VERTIC" />
              <div>
                <strong>VERTIC</strong>
                <span>ADAPTIVE BACK SUPPORT</span>
              </div>
            </div>

            <p className="tech-kicker"><span /> ADAPTIVE TENSION TECHNOLOGY</p>
            <h1 id="hero-title">
              ระบบพยุงหลังที่
              <span>ปรับแรงกระชับได้ตามคุณ</span>
            </h1>
            <p className="hero-lead">
              ผสานโครงสร้างพยุง 4 จุดเข้ากับระบบดึงปรับแรงแบบคู่
              กระจายแรงรอบช่วงเอวอย่างเป็นระบบ ให้คุณเลือกความกระชับที่พอดีในทุกกิจกรรม
            </p>

            <div className="tech-specs" aria-label="เทคโนโลยีเด่น">
              <div><b>4</b><span>POINT<br />STABILIZATION</span></div>
              <div><b>2×</b><span>TENSION<br />CONTROL</span></div>
              <div><b>360°</b><span>WRAP<br />SUPPORT</span></div>
            </div>

            <button className="hero-cta" type="button" onClick={scrollToOrder}>
              สัมผัสระบบพยุง VERTIC <span>→</span>
            </button>
            <p className="hero-microcopy">ส่งฟรีทั่วไทย · ชำระเงินเมื่อได้รับสินค้า</p>
          </div>

          <div className="hero-visual">
            <div className="visual-orbit" aria-hidden="true" />
            <img src={funnelImages[0]} alt="Sales funnel image 1 — เข็มขัดพยุงหลัง VERTIC" />
            <span className="visual-label">ENGINEERED<br />FOR DAILY SUPPORT</span>
          </div>
        </div>
      </section>

      <section className="funnel-gallery" aria-label="รายละเอียดสินค้า">
        {funnelImages.slice(1).map((source, index) => (
          <img
            key={source}
            src={source}
            alt={`Sales funnel image ${index + 2}`}
            loading="lazy"
          />
        ))}
      </section>

      <section className="order-section" id="order" ref={orderRef}>
        <div className="order-shell">
          <div className="order-intro">
            <p>กรอกเพื่อสั่งซื้อ</p>
            <h2>สั่งซื้อ · เก็บเงินปลายทาง</h2>
            <span>ส่งฟรีทั่วไทย · ไม่ต้องโอนก่อน</span>
          </div>

          <form className="order-card" onSubmit={submitOrder} noValidate>
            <fieldset>
              <legend>เลือกแพ็กเกจ</legend>
              <div className="offer-grid">
                {packages.map((offer) => {
                  const originalPrice = offer.quantity === 1 ? 3500 : 1990 * offer.quantity;
                  return (
                    <label className={`offer ${packageId === offer.id ? "selected" : ""}`} key={offer.id}>
                      <input
                        type="radio"
                        name="package"
                        value={offer.id}
                        checked={packageId === offer.id}
                        onChange={() => setPackageId(offer.id)}
                      />
                      <span className="radio-mark" aria-hidden="true" />
                      <span className="offer-copy">
                        <strong>
                          {offer.quantity} ชิ้น
                          {offer.popular && <em>ขายดี</em>}
                        </strong>
                        <small><s>{formatBaht(originalPrice)}</s> <b>{formatBaht(offer.price)}</b></small>
                        {offer.savings > 0 && <i>ประหยัด {formatBaht(offer.savings)}</i>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="form-fields">
              <label className={fieldErrors.customerName ? "has-error" : ""}>
                ชื่อผู้รับสินค้า
                <input
                  name="customerName"
                  aria-label="ชื่อผู้รับสินค้า"
                  required
                  value={customerName}
                  aria-invalid={Boolean(fieldErrors.customerName)}
                  aria-describedby={fieldErrors.customerName ? "customerName-error" : undefined}
                  onChange={(event) => {
                    setCustomerName(event.target.value);
                    clearFieldError("customerName");
                  }}
                  placeholder="ชื่อจริงของผู้รับสินค้า"
                />
                {fieldErrors.customerName && <span className="field-error-message" id="customerName-error">{fieldErrors.customerName}</span>}
              </label>
              <label className={fieldErrors.phone ? "has-error" : ""}>
                เบอร์โทร
                <input
                  name="phone"
                  aria-label="เบอร์โทร"
                  required
                  inputMode="tel"
                  value={phone}
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    clearFieldError("phone");
                  }}
                  placeholder="เบอร์โทรศัพท์ 9–10 หลัก"
                />
                {fieldErrors.phone && <span className="field-error-message" id="phone-error">{fieldErrors.phone}</span>}
              </label>
              <label className={fieldErrors.addressLine ? "has-error" : ""}>
                ที่อยู่ (เช่น เลขที่บ้าน ห้อง)
                <textarea
                  name="addressLine"
                  aria-label="ที่อยู่ (เช่น เลขที่บ้าน ห้อง)"
                  required
                  value={addressLine}
                  aria-invalid={Boolean(fieldErrors.addressLine)}
                  aria-describedby={fieldErrors.addressLine ? "addressLine-error" : undefined}
                  onChange={(event) => {
                    setAddressLine(event.target.value);
                    clearFieldError("addressLine");
                  }}
                  placeholder="บ้านเลขที่ หมู่ อาคาร ซอย ถนน ห้อง"
                />
                {fieldErrors.addressLine && <span className="field-error-message" id="addressLine-error">{fieldErrors.addressLine}</span>}
              </label>

              <div className="address-grid">
                <label className={fieldErrors.province ? "has-error" : ""}>
                  จังหวัด
                  <select
                    name="province"
                    aria-label="จังหวัด"
                    required
                    value={province}
                    aria-invalid={Boolean(fieldErrors.province)}
                    aria-describedby={fieldErrors.province ? "province-error" : undefined}
                    onChange={(event) => {
                      setProvince(event.target.value);
                      setAmphoe("");
                      setDistrict("");
                      clearFieldError("province");
                    }}
                  >
                    <option value="">เลือกจังหวัด</option>
                    {provinceOptions.map((item) => <option value={item} key={item}>{item}</option>)}
                  </select>
                  {fieldErrors.province && <span className="field-error-message" id="province-error">{fieldErrors.province}</span>}
                </label>
                <label className={fieldErrors.amphoe ? "has-error" : ""}>
                  อำเภอ/เขต
                  <select
                    name="amphoe"
                    aria-label="อำเภอ/เขต"
                    required
                    disabled={!province}
                    value={amphoe}
                    aria-invalid={Boolean(fieldErrors.amphoe)}
                    aria-describedby={fieldErrors.amphoe ? "amphoe-error" : undefined}
                    onChange={(event) => {
                      setAmphoe(event.target.value);
                      setDistrict("");
                      clearFieldError("amphoe");
                    }}
                  >
                    <option value="">เลือกอำเภอ/เขต</option>
                    {amphoeOptions.map((item) => <option value={item} key={item}>{item}</option>)}
                  </select>
                  {fieldErrors.amphoe && <span className="field-error-message" id="amphoe-error">{fieldErrors.amphoe}</span>}
                </label>
                <label className={fieldErrors.district ? "has-error" : ""}>
                  ตำบล/แขวง
                  <select
                    name="district"
                    aria-label="ตำบล/แขวง"
                    required
                    disabled={!amphoe}
                    value={district}
                    aria-invalid={Boolean(fieldErrors.district)}
                    aria-describedby={fieldErrors.district ? "district-error" : undefined}
                    onChange={(event) => {
                      setDistrict(event.target.value);
                      clearFieldError("district");
                    }}
                  >
                    <option value="">เลือกตำบล/แขวง</option>
                    {districtOptions.map((item) => <option value={item} key={item}>{item}</option>)}
                  </select>
                  {fieldErrors.district && <span className="field-error-message" id="district-error">{fieldErrors.district}</span>}
                </label>
                <label className={fieldErrors.zipcode ? "has-error" : ""}>
                  รหัสไปรษณีย์
                  <input
                    name="zipcode"
                    aria-label="รหัสไปรษณีย์"
                    value={zipcode}
                    aria-invalid={Boolean(fieldErrors.zipcode)}
                    aria-describedby={fieldErrors.zipcode ? "zipcode-error" : undefined}
                    readOnly
                    placeholder="เลือกพื้นที่ก่อน"
                  />
                  {fieldErrors.zipcode && <span className="field-error-message" id="zipcode-error">{fieldErrors.zipcode}</span>}
                </label>
              </div>
            </div>

            <div className="order-assurance">✓ ตรวจสอบข้อมูลก่อนจัดส่งทุกออเดอร์</div>
            <button className="submit-order" type="submit" disabled={submitting}>
              <strong>{submitting ? "กำลังบันทึกคำสั่งซื้อ..." : "✓ ยืนยันการสั่งซื้อ จัดส่งทันที"}</strong>
              <span>ส่งฟรี · เก็บเงินปลายทาง · ไม่ต้องโอนก่อน</span>
            </button>
            <p className="privacy-note">🔒 ข้อมูลของคุณใช้สำหรับจัดส่งสินค้าเท่านั้น</p>
            {notice && <p className="notice" role="status">{notice}</p>}
          </form>
        </div>
      </section>

      <footer>© 2026 VERTIC Thailand. All rights reserved.</footer>

      <div className="floating-order-bar">
        <div className="floating-price">
          <s>฿3,500</s>
          <strong>{formatBaht(selected.price)}</strong>
          <span>ส่งฟรี · เก็บปลายทาง</span>
        </div>
        <button type="button" onClick={scrollToOrder}>🛒 สั่งซื้อเลย</button>
      </div>

      {confirmation && (
        <div className="success-modal-backdrop">
          <section
            className="success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
          >
            <button
              className="success-modal-close"
              type="button"
              aria-label="ปิดหน้าต่าง"
              onClick={() => setConfirmation(null)}
            >
              ×
            </button>
            <div className="success-check" aria-hidden="true">✓</div>
            <p className="success-kicker">ORDER CONFIRMED</p>
            <h2 id="success-title">รับออเดอร์เรียบร้อย</h2>
            <p className="success-thanks">ขอบคุณสำหรับคำสั่งซื้อครับ</p>

            <div className="success-order-summary">
              <span>รายการสั่งซื้อ</span>
              <strong>เข็มขัดพยุงหลัง VERTIC · {confirmation.quantity} ชิ้น</strong>
              <b>{formatBaht(confirmation.amount)}</b>
              <small>ชำระเงินปลายทาง</small>
            </div>

            <div className="success-address">
              <span>📍 จัดส่งที่</span>
              <strong>{confirmation.customerName}</strong>
              <p className="success-phone">☎ {confirmation.phone}</p>
              <address>{confirmation.deliveryAddress}</address>
            </div>

            <div className="success-next-steps">
              <p>🚚 ทีมงานจะตรวจสอบข้อมูลก่อนจัดส่ง</p>
              <p>💵 ชำระเงินเมื่อได้รับสินค้า ไม่ต้องโอนก่อน</p>
            </div>

            <button className="success-dismiss" type="button" onClick={() => setConfirmation(null)}>
              ปิดหน้าต่างนี้
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
