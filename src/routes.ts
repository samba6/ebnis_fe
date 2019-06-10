import { CLIENT_ONLY_PATH_PREFIX } from "./constants/client-only-prefix";

export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const SIGN_UP_URL = "/signup";
export const EXPERIENCES_URL = CLIENT_ONLY_PATH_PREFIX;
export const EXPERIENCE_DEFINITION_URL =
  CLIENT_ONLY_PATH_PREFIX + "/define-experience";

export interface ExpRouteParams {
  id: string;
}

export interface NewEntryRouteParams {
  experienceId: string;
}
