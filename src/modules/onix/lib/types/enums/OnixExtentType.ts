/**
 * ONIX CodeList 23 - ExtentType
 * e.g. "09" for running time, "00" for pages.
 * Some systems use numeric 0 for pages in old ONIX, or 9 for duration
 * https://ns.editeur.org/onix/en/23
 */
export enum OnixExtentType {
  Pages = 0, // or "00" => 	The highest-numbered page in a single numbered sequence of main content, usually the highest Arabic-numbered page in a book
  TextLength = 2, // or "02" => Number of words or characters of natural language text
  Duration = 9, // or "09" => Total duration in time, expressed in the specified extent unit. This is the ‘running time’ equivalent of code 11
  // ...
}
