/* istanbul ignore file */
import { LOGIN_URL } from "../../routes";

export function redirectToLogin() {
  window.location.href = LOGIN_URL;
}
