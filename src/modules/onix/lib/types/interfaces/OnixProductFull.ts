import { OnixNotificationType } from '@onix/types/enums';
import {
  OnixCollateralDetail,
  OnixDescriptiveDetail,
  OnixProductIdentifier,
  OnixProductionDetail,
  OnixProductSupply,
  OnixPublishingDetail,
} from '.';

export interface OnixProductFull {
  /**
   * A unique ID for the product record.
   */
  recordReference: string;

  /**
   * NotificationType (ONIX CodeList 1).
   * Indicates new record, update, delete, etc.
   */
  notificationType?: OnixNotificationType;

  /**
   * A list of product identifiers (ISBN, proprietary codes, etc.).
   */
  productIdentifiers?: OnixProductIdentifier[];

  /**
   * Descriptive details about the product.
   */
  descriptiveDetail?: OnixDescriptiveDetail;

  /**
   * Collateral details (descriptions, covers, previews, etc.).
   */
  collateralDetail?: OnixCollateralDetail;

  /**
   * Publishing details: publisher, city, status, dates, etc.
   */
  publishingDetail?: OnixPublishingDetail;

  /**
   * Production details: e.g. if it's an eBook or audiobook
   * with file info in BodyManifest, etc.
   */
  productionDetail?: OnixProductionDetail;

  /**
   * Product supply: availability, price, supplier, etc.
   */
  productSupply?: OnixProductSupply;
}
