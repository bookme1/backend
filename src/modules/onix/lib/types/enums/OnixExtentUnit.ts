/**
 * ONIX CodeList 24 - ExtentUnit
 * https://ns.editeur.org/onix/en/24
 */
export enum OnixExtentUnit {
  PhysicalPieces = 0, // "00" = Unbound sheets or leaves, where ‘pages’ is not appropriate. For example a count of the individual number of cards in a pack. Only for use in ONIX 3.0 or later.
  Characters = 1, // "01" = Approximate number of characters (including spaces) of natural language text. Only for use in ONIX 3.0 or later
  Words = 2, // "01" = Approximate number of characters (including spaces) of natural language text. Only for use in ONIX 3.0 or later
  Pages = 3, // "02" = Approximate number of words of natural language text
  Hours = 4, // "04" = hours
  Minutes = 5, // "05" = minutes
  Seconds = 6, // "06" = seconds
  Tracks = 11, // "11" = Of an audiobook on CD (or a similarly divided selection of audio files). Conventionally, each track is 3–6 minutes of running time, and track counts are misleading and inappropriate if the average track duration is significantly more or less than this. Note that track breaks are not necessarily aligned with structural breaks in the text (eg chapter breaks)
  KBytes = 18,
  MBytes = 19,
  Chapters = 31, // "31" = Number of chapters (or other similar subdivisions) of the content. Only for use in ONIX 3.0 or later
  // ...
}
