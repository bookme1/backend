import { OnixResourceFileFeature } from '.';

export interface OnixBodyResource {
  sequenceNumber?: number;
  resourceIdentifier?: {
    resourceIDType?: number; // CodeList 44
    idTypeName?: string;
    idValue?: string;
  };
  resourceFileFeatures?: OnixResourceFileFeature[];
  resourceFileLink?: string;
  resourceFileDate?: {
    resourceFileDateRole?: number; // CodeList 159?
    date?: string;
    dateformat?: string;
  };
}
