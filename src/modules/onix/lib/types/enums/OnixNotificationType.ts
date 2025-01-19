/**
 * ONIX CodeList 1 - Notification or Update Type
 * https://ns.editeur.org/onix/en/1
 */
export enum OnixNotificationType {
  EarlyNotification = 1, // "01" = Early notification
  AdvanceNotification = 2, // "02" = Advance notification (confirmed)
  NotificationOnPub = 3, // "03" = Notification or update on publication
  UpdatePartial = 4, // "04" = Update (partial)
  Delete = 5, // "05" = Delete
  NoticeOfReissue = 12, // "12" = Notice of reissue
  TransferSaleOrDistribution = 13, // "13" = Transfer of sale or distribution
  // ...
}
