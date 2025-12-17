export interface CanonicalProduct {
  id: string | null;
  name: string | null;
  category: string | null;
  subcategory: string | null;
  cost: number | null;
  price: number | null;
  color: string | null;
  brand: string | null;
  year: number | null;
  image: string | null;
  enriched_description: string | null;
}

export type RawCsvRow = Record<string, string | number | null>;