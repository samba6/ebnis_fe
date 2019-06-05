export const TOKEN_KEY = "ebnis-token-key";
export const SCHEMA_VERSION = "1.1"; // Must be a string.
export const SCHEMA_VERSION_KEY = "ebnis-apollo-schema-version";
export const SCHEMA_KEY = "ebnis-apollo-cache-persist";
export const SITE_TITLE = "Ebnis";
export const THEME_COLOR = "#5faac7";
export const USER_KEY = "nOQhAH4V54h9MMBS3BSwtE/2eZeQWHRnPfoC4K+RDuWairX";
export const PAGE_NOT_FOUND_TITLE = "Page Not Found";

export function makeSiteTitle(title: string) {
  return `${title} | ${SITE_TITLE}`;
}

// istanbul ignore next
export function noop() {
  return null;
}

export function setDocumentTitle(title?: string) {
  document.title = title ? title : SITE_TITLE;
}
