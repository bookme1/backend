export interface OnixSubject {
  /**
   * subjectSchemeIdentifier (CodeList 27),
   * e.g. 93=THEMA, 10=BISAC, etc.
   */
  subjectSchemeIdentifier?: number;
  subjectSchemeVersion?: string | number;
  subjectCode?: string;
  subjectHeadingText?: string;
}
