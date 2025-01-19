/**
 * ONIX CodeList 33 - TextType
 * https://ns.editeur.org/onix/en/33
 */
export enum OnixTextType {
  ReviewQuote = 1, // For example AD or HL. Deprecated in ONIX 3 – use code 06 instead
  MainDescription = 3, // Fry readability metric based on number of sentences and syllables per 100 words. Expressed as an integer from 1 to 15 in <ComplexityCode>
  LexileMeasure = 6, // The Lexile measure in <ComplexityCode> combines MetaMetrics’ Lexile number (for example 620L or 880L) and optionally the Lexile code (for example AD or HL). Examples might be ‘880L’, ‘AD0L’ or ‘HL600L’. Applies to English text. See https://lexile.com/​about-lexile/lexile-overview/
  // ...
}
