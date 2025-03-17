export interface OnixCollection {
  /**
   * Title of the series, or collection title.
   */
  titleOfCollection?: string;
  /**
   * Collection type (CodeList 148), e.g. 10=Publisher collection,
   * 20=Ascribed collection
   */
  collectionType?: number;
  // ...
}
