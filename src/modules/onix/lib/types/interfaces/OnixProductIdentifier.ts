export interface OnixProductIdentifier {
  /**
   * productIDType (CodeList 5).
   * e.g. 15 = ISBN-13, 01 = proprietary, etc.
   */
  productIDType?: number;
  /**
   * Additional name for the ID type (e.g. "КСД" or "PublisherCode").
   */
  idTypeName?: string;
  /**
   * The actual identifier value (e.g. "9786171290396").
   */
  idValue?: string;
}
