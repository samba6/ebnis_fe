export const domPrefix = "my-experiences";
export const hideDescriptionIconSelector = "js-hide-description";
export const toggleDescriptionMenuSelector = `js-${domPrefix}-toggle-description-menu`;
export const descriptionSelector = "js-description";
export const titleSelector = "js-experience-title";
export const experienceSelector = "js-experience";
export const searchTextInputId = `${domPrefix}-search-input`;
export const noSearchMatchId = `${domPrefix}-no-search-match`;
export const experienceMenuSelector = `js-${domPrefix}-experience-dropdown`;
export const deleteExperienceSelector = `js-${domPrefix}-delete-experience`;
export const noExperiencesInfoDomId = "no-experiences-info";
export const newExperienceButtonDomId = "new-experience-button";

export function makeExperienceTitleDomId(id: Id) {
  return `${domPrefix}-go-to-details-${id}`;
}

type Id = string | number;
