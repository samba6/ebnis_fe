export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const SIGN_UP_URL = "/sign-up";
export const EXP_DEF = "/exp-def";
export const ADD_EXP = "/add-exp/:exp_id";

export function makeAddExpRoute(id: string) {
  return ADD_EXP.replace(":exp_id", id);
}

export const setTitle = (title?: string) => {
  document.title = title ? `${title} | Ebnis` : "Ebnis";
};
