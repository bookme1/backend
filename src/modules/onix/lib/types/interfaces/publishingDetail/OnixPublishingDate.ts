export interface OnixPublishingDate {
  /**
   * publishingDateRole (CodeList 163), e.g. 1=Publication date
   */
  publishingDateRole?: number;
  date?: string; // "20210701"
  dateformat?: string; // "00" etc.
}
