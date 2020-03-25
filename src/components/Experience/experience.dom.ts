const domPrefix = "experience-component";
export const successNotificationId = `${domPrefix}-success-notification`;
export const closeSubmitNotificationBtnSelector = `js-${domPrefix}-close-submit-notification`;
export const warningNotificationId = `${domPrefix}-warning-notification`;
export const errorsNotificationId = `${domPrefix}-errors-notification`;
export const syncButtonId = `${domPrefix}-sync-button`;
export const newEntryTriggerSelector = `${domPrefix}-new-entry-trigger`;
export const experienceSyncedNotificationSuccessDom = `js-${domPrefix}-synced-notification-success`;
export const onOnlineExperienceSyncedNotificationErrorDom = `js-${domPrefix}-synced-notification-error`;
export const okDeleteExperienceDomId = `${domPrefix}-ok-delete-experience`;
export const cancelDeleteExperienceDomId = `${domPrefix}-cancel-delete-experience`;
export const experienceNoEntriesDomId = `${domPrefix}-experience-no-entries`;
export const experienceOptionsMenuTriggerSelector = `js-${domPrefix}-options-menu-trigger`;

export function makeDeleteMenuDomId(id: Id) {
  return `${domPrefix}-delete-menu-${id}`;
}

type Id = string | number;
