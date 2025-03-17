import { OnixLanguageRole } from '@onix/types/enums';

export interface OnixLanguage {
  languageRole?: OnixLanguageRole;
  languageCode?: string; // e.g. "ukr"
  countryCode?: string; // e.g. "UA"
}
