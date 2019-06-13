import { TOKEN_KEY, USER_KEY } from "../constants";
import { UserFragment } from "../graphql/apollo-types/UserFragment";

export const getToken = (): string | null => {
  // istanbul ignore next: branch required only for ssr
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY) || null;
};

export const storeToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const getUser = (): UserFragment | null => {
  // istanbul ignore next: branch required only for ssr
  if (typeof window === "undefined") {
    return null;
  }

  const data = localStorage.getItem(USER_KEY);

  if (data) {
    return JSON.parse(data) as UserFragment;
  }

  return null;
};

export const storeUser = async (user: UserFragment) =>
  localStorage.setItem(USER_KEY, JSON.stringify(user));

export const clearUser = async () => localStorage.removeItem(USER_KEY);
