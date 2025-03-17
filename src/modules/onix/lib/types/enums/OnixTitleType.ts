/**
 * ONIX CodeList 15 - TitleType
 * https://ns.editeur.org/onix/en/15
 * TODO:Needs to be extended
 */
export enum OnixTitleType {
  DistinctiveTitle = 1, // The full text of the distinctive title of the item, without abbreviation or abridgement. For books, generally taken from the title page
  OriginalTitle = 3, // Where the subject of the ONIX record is a translated item
  TranslatedTitle = 6, // A translation of Title Type 01 or 03, or an independent title, used when the work is translated into another language, sometimes termed a ‘parallel title’
  AlternativeTitle = 10, // The title carried in a book distributor’s title
  // ...
}
