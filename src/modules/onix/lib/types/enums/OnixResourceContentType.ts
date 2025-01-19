/**
 * ONIX CodeList 158 - ResourceContentType
 * https://ns.editeur.org/onix/en/158
 */
export enum OnixResourceContentType {
  FrontCover = 1, // 2D
  BackCover = 2, // 2D
  Cover = 3, // Not limited to front or back, including 3D perspective
  ContrivutorPicture = 4, // Photograph or portrait of contributor(s)
  PublisherLogo = 9,
  SampleContent = 15, // For example: a short excerpt, sample text or a complete sample chapter, page images, screenshots etc
  Description = 31, // Descriptive text in a separate downloadable file, not in the ONIX record. Equivalent of code 03 in List 153.
  // ...
}
