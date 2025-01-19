import { OnixBodyResource } from '.';

export interface OnixProductionDetail {
  /**
   * BodyManifest with multiple BodyResource (for eBook or audio files)
   */
  bodyResources?: OnixBodyResource[];
}
