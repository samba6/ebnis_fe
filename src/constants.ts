export const SITE_TITLE = "Ebnis";
export const THEME_COLOR = "#5faac7";
export const PAGE_NOT_FOUND_TITLE = "Page Not Found";
export const UNSAVED_ID_PREFIX = "ebnis-unsaved-id-";

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
  return UNSAVED_ID_PREFIX + id;
}

export function isUnsavedId(id?: string) {
  return id ? id.startsWith(UNSAVED_ID_PREFIX) : false;
}
