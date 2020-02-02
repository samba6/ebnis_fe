export const domPrefix = "my-experiences";
export const hideDescriptionIconSelector = "js-hide-description";
export const showDescriptionIconSelector = "js-show-description";
export const descriptionSelector = "js-description";
export const titleSelector = "js-experience-title";
export const experienceSelector = "js-experience";
export const searchTextInputId = `${domPrefix}-search-input`;
export const noSearchMatchId = `${domPrefix}-no-search-match`;

export function makeExperienceTitleDomId(id: Id) {
  return `${domPrefix}-go-to-details-${id}`;
}

type Id = string | number;
