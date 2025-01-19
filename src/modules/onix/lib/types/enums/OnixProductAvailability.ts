/**
 * ONIX CodeList 65 - ProductAvailability
 * https://ns.editeur.org/onix/en/65
 */
export enum OnixProductAvailability {
  Available = 20, // Product is available from the supplier (form of availability unspecified)
  InStock = 21, // Product is available from the supplier as a stock item
  ToOrder = 22, // Product is available from the supplier as a non-stock item, by special order
  POD = 23, // Product is available from the supplier by print-on-demand
  TemporarilyUnavailable = 30, // Product is temporarily unavailable (reason unspecified)
  OutOfStock = 31, // Product is temporarily out of stock
  Reprinting = 32, // Product is temporarily unavailable, and is being reprinted
  AwaitingReissue = 33, // Product is temporarily unavailable, awaiting reissue
  TemporarilyWithdrawn = 34, // Product is temporarily withdrawn from sale, possibly for quality or technical reasons
  NotAvailable = 40, // Product is not available from the supplier (for any reason)
  ReplacedByNewProduct = 41, // Product is unavailable, but a successor product or edition is or will be available
  OtherFormatAvailable = 42, // Product is unavailable, but the same content is or will be available in an alternative format
  NoLongerSupplied = 43, // Product is no longer available from the supplier
  ApplyDirect = 44, // Product is not available to trade, apply direct to publisher
  NotSoldSeparately = 45, // Product must be bought as part of a set or trade pack
  WithdrawnFromSale = 46, // Product is withdrawn from sale, possibly permanently
  Remaindered = 47, // Product has been remaindered and is no longer available from the supplier
  ReplacedByPOD = 48, // Product is out of print, but a print-on-demand edition is or will be available under a different ISBN
  Recalled = 49, // Product has been recalled, possibly for reasons of consumer safety
  NotSoldAsSet = 50, // Contents of set or pack must be bought as individual items
  PublisherIndicatesOP = 51, // Product is unavailable, publisher indicates it is out of print
  NoLongerSoldInMarket = 52, // Product is unavailable in this market, but may be available elsewhere
  NoRecentUpdate = 97, // Sender has not received any recent update for this product from the publisher or supplier
  NoLongerReceivingUpdates = 98, // Sender is no longer receiving updates from the publisher or supplier
  ContactSupplier = 99, // Product availability not known to sender
}
