import { OnixResourceFileFeatureType } from '@onix/types/enums';

export interface OnixResourceFileFeature {
  resourceFileFeatureType?: OnixResourceFileFeatureType | number; // 6=MD5,7=size
  resourceFileFeatureValue?: string | number;
}
