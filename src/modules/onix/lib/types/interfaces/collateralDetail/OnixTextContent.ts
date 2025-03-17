import { OnixContentAudience, OnixTextType } from '@onix/types/enums';

export interface OnixTextContent {
  textType?: OnixTextType | number; // CodeList 33
  contentAudience?: OnixContentAudience | number; // CodeList 154
  text?: string; // The actual HTML or text
  language?: string;
  sourcename?: string;
  datestamp?: string;
}
