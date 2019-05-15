export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const SIGN_UP_URL = "/signup";
export const CLIENT_ONLY_PATH_PREFIX = "/app";
export const EXPERIENCES_URL = CLIENT_ONLY_PATH_PREFIX;
export const EXPERIENCE_DEFINITION_URL =
  CLIENT_ONLY_PATH_PREFIX + "/define-experience";
export const EXPERIENCE_URL =
  CLIENT_ONLY_PATH_PREFIX + "/experience/:experienceId";
export const NEW_ENTRY_URL =
  CLIENT_ONLY_PATH_PREFIX + "/experience/:experienceId/entry";

export function makeExperienceRoute(experienceId: string) {
  return EXPERIENCE_URL.replace(":experienceId", experienceId);
}

export function makeNewEntryRoute(experienceId: string) {
  return NEW_ENTRY_URL.replace(":experienceId", experienceId);
}

export interface ExpRouteParams {
  id: string;
}

export interface NewEntryRouteParams {
  experienceId: string;
}
