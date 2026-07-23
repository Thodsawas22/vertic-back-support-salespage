export type ThaiAddress = {
  district: string;
  amphoe: string;
  province: string;
  zipcode: string;
};

type CompressedDatabase = { data: unknown[]; lookup: string; words: string };

export function decodeThaiAddress(database: CompressedDatabase): ThaiAddress[] {
  const output: ThaiAddress[] = [];
  const words = database.words.split("|");
  const lookup = database.lookup.split("|");
  const decode = (value: string | number) => {
    if (typeof value === "number") value = lookup[value];
    return value.replace(/[A-Z]/gi, (letter) => {
      const code = letter.charCodeAt(0);
      return words[code < 97 ? code - 65 : 26 + code - 97];
    });
  };

  for (const provinceItem of database.data as unknown[][]) {
    const offset = provinceItem.length === 3 ? 2 : 1;
    const provinceName = decode(provinceItem[0] as string | number);
    for (const amphoeItem of provinceItem[offset] as unknown[][]) {
      const amphoeName = decode(amphoeItem[0] as string | number);
      for (const districtItem of amphoeItem[offset] as unknown[][]) {
        const districtName = decode(districtItem[0] as string | number);
        const zipcodes = districtItem[offset] instanceof Array ? districtItem[offset] : [districtItem[offset]];
        for (const zipcode of zipcodes) output.push({ province: provinceName, amphoe: amphoeName, district: districtName, zipcode: String(zipcode) });
      }
    }
  }
  return output;
}

export const provinces = (items: ThaiAddress[]) => [...new Set(items.map((item) => item.province))].sort((a, b) => a.localeCompare(b, "th"));
export const districtsForProvince = (items: ThaiAddress[], province: string) => [...new Set(items.filter((item) => item.province === province).map((item) => item.amphoe))].sort((a, b) => a.localeCompare(b, "th"));
export const subdistrictsForDistrict = (items: ThaiAddress[], province: string, amphoe: string) => [...new Set(items.filter((item) => item.province === province && item.amphoe === amphoe).map((item) => item.district))].sort((a, b) => a.localeCompare(b, "th"));
export const zipcodeForAddress = (items: ThaiAddress[], province: string, amphoe: string, district: string) => items.find((item) => item.province === province && item.amphoe === amphoe && item.district === district)?.zipcode ?? "";
