export interface OnixPublisher {
  publishingRole?: number; // CodeList 45
  publisherIdentifier?: {
    publisherIDType?: number; // CodeList 44
    idTypeName?: string;
    idValue?: string;
  };
  publisherName?: string;
}
