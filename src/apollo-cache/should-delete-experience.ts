/* istanbul ignore file */
const SHOULD_DELETE_KEY = "@ebnis/should-delete-experience";
const WAS_DELETED_KEY = "@ebnis/experience-was-deleted";

export function writeShouldDeleteExperience(id: string) {
  window.localStorage.setItem(SHOULD_DELETE_KEY, id);
}

export function confirmShouldDeleteExperience(id: string) {
  const savedId = window.localStorage.getItem(SHOULD_DELETE_KEY);

  if (savedId === id) {
    window.localStorage.removeItem(SHOULD_DELETE_KEY);
    return true;
  }

  return false;
}

export function writeDeletedExperienceTitle(title: string) {
  window.localStorage.setItem(WAS_DELETED_KEY, title);
}

export function getDeletedExperienceTitle() {
  const title = window.localStorage.getItem(WAS_DELETED_KEY);

  if (title) {
    window.localStorage.removeItem(WAS_DELETED_KEY);
    return title;
  }

  return null;
}
