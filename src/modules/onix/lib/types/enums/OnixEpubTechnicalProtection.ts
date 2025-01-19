/**
 * ONIX CodeList 144 - EpubTechnicalProtection
 * https://ns.editeur.org/onix/en/144
 */
export enum OnixEpubTechnicalProtection {
  None = 0, // "00" or "0" = no technical protection
  Watermark = 1, // "01" = watermarking
  DRM = 2, // "02" = DRM
}
