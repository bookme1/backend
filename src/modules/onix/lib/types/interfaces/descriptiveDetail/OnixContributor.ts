import { OnixContributorRole } from '@onix/types/enums';

export interface OnixContributor {
  sequenceNumber?: number;
  /**
   * contributorRole (CodeList 17) e.g. A01=Author, B06=Translator, E07=Narrator
   */
  contributorRole?: (OnixContributorRole | string)[];
  /**
   * The display name of the person
   */
  personName?: string;
  /**
   * For audio, might also have role "narrator"
   */
  personNameKey?: string; // e.g. Surname
  corporateName?: string; // if it's an organization
  fromLanguage?: string; // e.g. "eng"
  biographicalNote?: string; // HTML about author
  datestamp?: string; // e.g. "20220722T1602"
}
