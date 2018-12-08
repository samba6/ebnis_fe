export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const SIGN_UP_URL = "/sign-up";
export const NEW_EXP_URL = "/new-exp";
export const EXP_URL = "/exp/:id";

export function makeExpRoute(id: string) {
  return EXP_URL.replace(":id", id);
}

export interface ExpRouteParams {
  id: string;
}

export const setTitle = (title?: string) => {
  document.title = title ? `${title} | Ebnis` : "Ebnis";
};
