import {
  OnixContentAudience,
  OnixResourceContentType,
  OnixResourceMode,
} from '@onix/types/enums';
import { OnixResourceVersion } from './OnixResourceVersion';

export interface OnixSupportingResource {
  resourceContentType?: OnixResourceContentType | number; // CodeList 158
  contentAudience?: OnixContentAudience | number; // CodeList 154
  resourceMode?: OnixResourceMode | number; // CodeList 159
  resourceVersions?: OnixResourceVersion[];
  sourcename?: string;
  datestamp?: string;
}
