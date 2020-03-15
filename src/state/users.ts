/* istanbul ignore file */
import { UserFragment } from "../graphql/apollo-types/UserFragment";

const USER_KEY = "nOQhAH4V54h9MMBS3BSwtE/2eZeQWHRnPfoC4K+RDuWairX";
const LOGGED_OUT_USER_KEY = "m9k5IrZMdh+JcsGm";

export function getUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const data = localStorage.getItem(USER_KEY);

  if (data) {
    return JSON.parse(data) as UserFragment;
  }

  return null;
}

export function storeUser(user?: UserFragment | null | void) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

export function storeLoggedOutUser() {
  const user = localStorage.getItem(USER_KEY);

  if (user) {
    localStorage.setItem(LOGGED_OUT_USER_KEY, user);
  }
}

export function logoutUser() {
  storeLoggedOutUser();
  clearUser();
}

export function getLoggedOutUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const user = localStorage.getItem(LOGGED_OUT_USER_KEY);

  if (user) {
    return JSON.parse(user) as UserFragment;
  }

  return null;
}

export function clearLoggedOutUser() {
  localStorage.removeItem(LOGGED_OUT_USER_KEY);
}

export function getToken() {
  const user = getUser();

  return user ? user.jwt : "";
}
