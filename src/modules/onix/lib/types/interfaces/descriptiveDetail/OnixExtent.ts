import { OnixExtentType, OnixExtentUnit } from '@onix/types/enums';

export interface OnixExtent {
  extentType?: OnixExtentType;
  extentValue?: number;
  extentUnit?: OnixExtentUnit;
}
