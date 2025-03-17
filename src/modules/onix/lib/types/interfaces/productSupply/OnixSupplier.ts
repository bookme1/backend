export interface OnixSupplier {
  supplierRole?: number; // CodeList 93
  supplierIdentifier?: {
    supplierIDType?: number; // CodeList 92
    idValue?: string;
  };
  supplierName?: string;
}
