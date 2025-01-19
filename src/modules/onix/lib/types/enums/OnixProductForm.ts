/**
 * ONIX CodeList 7 - Product Form
 * Key eBook and Audio codes, etc.
 * https://ns.editeur.org/onix/en/7
 */
export enum OnixProductForm {
  // Digital eBook forms
  EBookUnknown = 'EB', // generic e-book
  EBookAll = 'EA', // aggregator or vendor-specific
  // Audio forms
  AudioCD = 'AC', // Audio CD
  AudioDownload = 'AJ', // Downloadable audio file
  // Physical book forms
  Hardback = 'BB',
  Paperback = 'BC',
  // ...
}
