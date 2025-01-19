import { OnixResourceFileFeatureType } from '@onix/types/enums';

export interface OnixResourceVersionFeature {
  resourceVersionFeatureType?: number | OnixResourceFileFeatureType; // e.g. 6=MD5,7=size
  featureValue?: string;
}
