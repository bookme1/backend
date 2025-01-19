import { OnixResourceVersionFeature } from './OnixResourceVersionFeature';

export interface OnixResourceVersion {
  resourceForm?: number; // CodeList 177?
  resourceVersionFeatures?: OnixResourceVersionFeature[];
  resourceLink?: string;
  contentDate?: {
    contentDateRole?: number; // CodeList 155?
    date?: string; // "20220722T1306Z"
    dateformat?: string; // "13"
  };
}
