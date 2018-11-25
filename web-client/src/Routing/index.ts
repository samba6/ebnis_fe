export const ROOT_URL = "/";
export const LOGIN_URL = "/login";
export const SIGN_UP_URL = "/sign-up";

let titleEl = document.getElementById("ebnis-title");

export const setTitle = (title?: string) => {
  if (!titleEl) {
    titleEl = document.getElementById("ebnis-title");
  }

  if (titleEl) {
    titleEl.innerText = title ? `Ebnis | ${title}` : "Ebnis";
  }
};
