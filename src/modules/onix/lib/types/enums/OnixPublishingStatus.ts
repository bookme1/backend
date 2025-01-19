/**
 * ONIX CodeList 64 - PublishingStatus
 * https://ns.editeur.org/onix/en/64
 */
export enum OnixPublishingStatus {
  Unspecified = 0, // Status is not specified
  Cancelled = 1, // The product was announced, and subsequently abandoned
  Forthcoming = 2, // Not yet published
  PostponedIndefinitely = 3, // The product was announced, and subsequently postponed with no expected publication date
  Active = 4, // The product was published, and is still active in the sense that the publisher will accept orders for it
  NoLongerOurProduct = 5, // Ownership of the product has been transferred to another publisher
  OutOfStockIndefinitely = 6, // The product was active, but is now inactive without plans to restock
  OutOfPrint = 7, // The product is no longer being produced or sold
  Inactive = 8, // The product is inactive, orders are not accepted
  Unknown = 9, // The sender does not know the current publishing status
  Remaindered = 10, // The product is no longer available at the current publisher but may be sold through other channels
  WithdrawnFromSale = 11, // Withdrawn, typically for legal reasons or to avoid giving offence
  RecalledDeprecated = 12, // Deprecated: Recalled for reasons of consumer safety (use code 15 instead)
  NotSoldSeparately = 13, // Published and active, but not sold separately, only as part of a pack or assembly
  Recalled = 15, // Recalled for reasons of consumer safety
  TemporarilyWithdrawn = 16, // Withdrawn temporarily, typically for quality or technical reasons
  PermanentlyWithdrawn = 17, // Withdrawn permanently from sale, specific to digital products
  NotSoldAsSet = 18, // Published and active, but not sold together as a single product
}
