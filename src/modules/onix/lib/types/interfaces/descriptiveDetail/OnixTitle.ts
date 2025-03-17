import { OnixTitleType } from '@onix/types/enums';

export interface OnixTitle {
  titleType?: OnixTitleType;
  /**
   * Title statement might combine multiple parts (like "Title: Subtitle").
   */
  titleStatement?: string;
  /**
   * TitleElement details
   */
  titleElementLevel?: number;
  titleText?: string;
  subtitle?: string;
  language?: string;
}
