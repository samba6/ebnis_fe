export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const SIGN_UP_URL = "/signup";
export const NEW_EXP_URL = "/exp";
export const EXP_URL = "/exp/:id";
export const NEW_ENTRY_URL = "/exp/:expId/entry";

export function makeExpRoute(id: string) {
  return EXP_URL.replace(":id", id);
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
