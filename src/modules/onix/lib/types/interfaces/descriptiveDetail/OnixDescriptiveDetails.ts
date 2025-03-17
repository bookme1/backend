import {
  OnixEditionType,
  OnixEpubTechnicalProtection,
  OnixProductComposition,
  OnixProductForm,
} from '@onix/types/enums';
import {
  OnixAudienceRange,
  OnixCollection,
  OnixContributor,
  OnixExtent,
  OnixLanguage,
  OnixSubject,
  OnixTitle,
} from '.';

export interface OnixDescriptiveDetail {
  /**
   * productComposition (CodeList 2), e.g. single item, multiple item, etc.
   */
  productComposition?: OnixProductComposition;

  /**
   * productForm (CodeList 7), e.g. "EA" = eBook aggregator,
   * "AJ" = downloadable audio, etc.
   */
  productForm?: OnixProductForm;

  /**
   * productFormDetail (CodeList 78),
   * e.g. "E101" = EPUB, "E127" = MOBI, "A103"=MP3
   */
  productFormDetail?: string[]; // you can map them to OnixProductFormDetail

  /**
   * Edition type (CodeList 21): "ILL"=Illustrated, "REV"=revised, etc.
   */
  editionType?: OnixEditionType[];

  /**
   * Edition statement: e.g. "2nd revised edition".
   */
  editionStatement?: string;

  /**
   * Title details
   */
  titles?: OnixTitle[];

  /**
   * Contributors (authors, translators, narrators, etc.).
   */
  contributors?: OnixContributor[];

  /**
   * Language info
   */
  language?: OnixLanguage[];

  /**
   * If the book is part of a series, may include series info.
   */
  collection?: OnixCollection;

  /**
   * Number in series or volume.
   */
  volumeNumber?: string;

  /**
   * Extent (pages, duration, etc.).
   */
  extent?: OnixExtent[];

  /**
   * A list of subject codes (BISAC, THEMA, etc.).
   */
  subjects?: OnixSubject[];

  /**
   * Audience range: e.g. min age, max age.
   */
  audienceRange?: OnixAudienceRange;

  /**
   * Epub technical protection (DRM, watermark).
   */
  epubTechnicalProtection?: OnixEpubTechnicalProtection;
}
