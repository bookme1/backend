export interface ShortOnixProduct {
  id: string; // e.g. ISBN or recordReference
  title: string; // main title
  contributors: string; // comma-separated authors, etc.
  coverUrl: string;
  description: string;
  price: number;
  currency: string;
  availability: boolean; // simplified: is it "Available" or not
  // plus any other minimal fields
}
