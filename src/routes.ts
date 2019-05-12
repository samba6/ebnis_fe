export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const SIGN_UP_URL = "/signup";
export const CLIENT_ONLY_PATH_PREFIX = "/app";
export const EXPERIENCES_URL = CLIENT_ONLY_PATH_PREFIX;
export const EXPERIENCE_DEFINITION_URL =
  CLIENT_ONLY_PATH_PREFIX + "/define-experience";
export const EXP_URL = CLIENT_ONLY_PATH_PREFIX + "/experience/:experienceId";
export const NEW_ENTRY_URL =
  CLIENT_ONLY_PATH_PREFIX + "/experience/:experienceId/entry";

export function makeExpRoute(id: string) {
  return EXP_URL.replace(":experienceId", id);
}

export function makeNewEntryRoute(expId: string) {
  return NEW_ENTRY_URL.replace(":expId", expId);
}

export interface ExpRouteParams {
  id: string;
}

export interface NewEntryRouteParams {
  expId: string;
}

export const setTitle = (title?: string) => {
  document.title = title ? `${title} | Ebnis` : "Ebnis";
};
