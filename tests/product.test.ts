import { describe, expect, it } from "vitest";
import { packages, formatBaht } from "../lib/product";

describe("sales page product offers", () => {
  it("offers one, two and three-piece COD packages with honest unit prices", () => {
    expect(packages).toHaveLength(3);
    expect(packages.map((offer) => offer.quantity)).toEqual([1, 2, 3]);
    expect(packages[0]).toMatchObject({ price: 1990, savings: 0 });
    expect(packages[1]).toMatchObject({ price: 3490, savings: 490, popular: true });
    expect(packages[2]).toMatchObject({ price: 4990, savings: 980 });
  });

  it("formats Thai baht without making a false single-item discount claim", () => {
    expect(formatBaht(1990)).toBe("฿1,990");
    expect(formatBaht(4990)).toBe("฿4,990");
  });
});
