/**
 * ONIX CodeList 22 - LanguageRole
 * https://ns.editeur.org/onix/en/22
 */
export enum OnixLanguageRole {
  LanguageOfText = 1, // Language of text
  OriginalLanguage = 2, // Where the text in the original language is NOT part of the current product
  TranslatedFrom = 3, // Where different from language of text: used mainly for serials
  // ...
}
