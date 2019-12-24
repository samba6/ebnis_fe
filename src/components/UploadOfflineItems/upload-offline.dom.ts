import { CreationMode } from "./upload-offline.utils";

export const domPrefix = "upload-offline";

export function makeCompletelyOfflineExperienceTitleId(
  id: Id,
  mode: CreationMode,
) {
  return `${domPrefix}-${mode}-experience-title-${id}`;
}

type Id = string | number;
