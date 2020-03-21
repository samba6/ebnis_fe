const domPrefix = "experience-component";
export const successNotificationId = `${domPrefix}-success-notification`;
export const closeSubmitNotificationBtnSelector = `js-${domPrefix}-close-submit-notification`;
export const warningNotificationId = `${domPrefix}-warning-notification`;
export const errorsNotificationId = `${domPrefix}-errors-notification`;
export const syncButtonId = `${domPrefix}-sync-button`;
export const newEntryTriggerId = `${domPrefix}-new-entry-trigger`;
export const experienceMenuTriggerDomId = `${domPrefix}-menu-trigger`;
export const onOnlineExperienceSyncedNotificationSuccessDom = `js-${domPrefix}-on-online-experience-synced-notification-success`;
export const onOnlineExperienceSyncedNotificationErrorDom = `js-${domPrefix}-on-online-experience-synced-notification-error`;
export const okDeleteExperienceDomId = `${domPrefix}-ok-delete-experience`;
export const cancelDeleteExperienceDomId = `${domPrefix}-cancel-delete-experience`;
export const experienceNoEntriesDomId = `${domPrefix}-experience-no-entries`;

export function makeDeleteMenuDomId(id: Id) {
  return `${domPrefix}-delete-menu-${id}`;
}

type Id = string | number;