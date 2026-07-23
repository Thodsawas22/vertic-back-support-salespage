export type PackageOffer = {
  id: "one" | "two" | "three";
  quantity: number;
  price: number;
  savings: number;
  popular?: boolean;
};

export const packages: PackageOffer[] = [
  { id: "one", quantity: 1, price: 1990, savings: 0 },
  { id: "two", quantity: 2, price: 3490, savings: 490, popular: true },
  { id: "three", quantity: 3, price: 4990, savings: 980 },
];

export const formatBaht = (amount: number) =>
  `฿${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`;

export const productName = "เข็มขัดพยุงหลังและเอว";
