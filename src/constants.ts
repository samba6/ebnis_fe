/* istanbul ignore file */
export const SITE_TITLE = "Ebnis";
export const THEME_COLOR = "#5faac7";
export const PAGE_NOT_FOUND_TITLE = "Page Not Found";
export const OFFLINE_ID_PREFIX = "ebnis-unsaved-id-";

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

export function makeOfflineId(id: string | number = new Date().getTime()) {
  return OFFLINE_ID_PREFIX + id;
}

export function isOfflineId(id?: string) {
  return id ? id.startsWith(OFFLINE_ID_PREFIX) : false;
}

export function makeApolloCacheRef(typeName: string, id: string | number) {
  return `${typeName}:${id}`;
}
