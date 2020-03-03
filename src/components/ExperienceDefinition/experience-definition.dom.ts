import { DataTypes } from "../../graphql/apollo-types/globalTypes";

export const domPrefix = "experience-definition";

export const scrollIntoViewDomId = `${domPrefix}-scroll-into-view`;
export const titleInputDomId = `${domPrefix}-title-input`;
export const descriptionInputDomId = `${domPrefix}-description-input`;
export const definitionNameInputDomId = `${domPrefix}-definition-name-input`;
export const definitionTypeInputDomId = `${domPrefix}-definition-type-input`;
export const submitDomId = `${domPrefix}-submit`;
export const resetDomId = `${domPrefix}-reset`;
export const notificationErrorCloseId = `${domPrefix}-notification-error-close`;
export const notificationWarningCloseId = `${domPrefix}-notification-warning-close`;
export const revealDescriptionInputDomId = `${domPrefix}-reveal-description-input`;
export const hideDescriptionInputDomId = `${domPrefix}-hide-description-input`;
export const addDefinitionSelector = "js-add-definition";
export const removeDefinitionSelector = "js-remove-definition";
export const moveUpDefinitionSelector = "js-move-up-definition";
export const moveDownDefinitionSelector = "js-move-down-definition";

export function makeDefinitionTypeOptionDomId(type: DataTypes) {
  return `${domPrefix}-${type}`;
}

export function makeDefinitionContainerDomId(id: Id) {
  return `${domPrefix}-definition-container-${id}`;
}

type Id = string | number;
