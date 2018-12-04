export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const SIGN_UP_URL = "/sign-up";
export const EXP_DEF = "/exp-def";
export const ADD_EXP = "/add-exp/:id";

export function makeAddExpRoute(id: string) {
  return ADD_EXP.replace(":id", id);
}

export interface AddExpRouteParams {
  id: string;
}

export const setTitle = (title?: string) => {
  document.title = title ? `${title} | Ebnis` : "Ebnis";
};
