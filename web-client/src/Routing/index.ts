export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const SIGN_UP_URL = "/sign-up";
export const NEW_EXP = "/new-exp";

export const setTitle = (title?: string) => {
  document.title = title ? `${title} | Ebnis` : "Ebnis";
};
