import { OnixPublishingStatus } from '@onix/types/enums';
import { OnixPublisher, OnixPublishingDate } from '.';

export interface OnixPublishingDetail {
  imprint?: string;
  publisher?: OnixPublisher;
  cityOfPublication?: string;
  /**
   * publishingStatus (CodeList 64), e.g. 7=Active, 8=OutOfPrint
   */
  publishingStatus?: OnixPublishingStatus | number;
  publishingDates?: OnixPublishingDate[];
  salesRights?: {
    salesRightsType?: number; // CodeList 46
    territory?: {
      regionsIncluded?: string; // "WORLD"
    };
  };
}
