import { OnixSupportingResource, OnixTextContent } from '.';

export interface OnixCollateralDetail {
  /**
   * Possibly multiple textContents (e.g. main description, review quotes).
   */
  textContents?: OnixTextContent[];

  /**
   * Possibly multiple supportingResources (covers, sample, audio clips).
   */
  supportingResources?: OnixSupportingResource[];
}
