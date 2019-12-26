import { CreationMode } from "./upload-offline.utils";

export const domPrefix = "upload-offline-items";

export function makeExperienceComponentId(id: Id, mode: CreationMode) {
  return `${domPrefix}-${mode}-experience-title-${id}`;
}

export const createdOnlineExperiencesContainerId = `${domPrefix}-created-online-experiences-container`;

export const createdOfflineExperiencesContainerId = `${domPrefix}-created-offline-experiences-container`;

export const offlineExperiencesTabMenuDomId = `${domPrefix}-offline-experiences-tab-menu`;

export const uploadBtnDomId = `${domPrefix}-upload-btn`

export const uploadSuccessIconClassName = 'upload-success-icon'

const experienceUploadStatusClassNamePrefix = "upload-experience-status--";

export function makeExperienceUploadStatusClassNames(
  didSucceed?: boolean,
  hasError?: boolean,
) {
  if (didSucceed) {
    return [
      experienceUploadStatusClassNamePrefix + "success",
      "experience-title--success",
    ];
  }

  if (hasError) {
    return [
      experienceUploadStatusClassNamePrefix + "error",
      "experience-title--error",
    ];
  }

  return ["", ""];
}

export function makeUploadStatusIconId(id: Id, status: "success" | "error") {
  return `${domPrefix}-upload-status-${status}-icon-${id}`;
}

export function makeEntryId(entryId: Id) {
  return `${domPrefix}-entry-${entryId}`;
}

export function makeExperienceErrorId(id: Id) {
  return `${domPrefix}-experience-error-${id}`;
}

type Id = string | number;
