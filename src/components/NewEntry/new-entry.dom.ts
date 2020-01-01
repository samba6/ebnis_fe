export const domPrefix = "new-entry";
export const submitBtnDomId = `${domPrefix}-submit-btn`;
export const networkErrorDomId = `${domPrefix}-network-error`;
export const scrollIntoViewNonFieldErrorDomId = `${domPrefix}-scroll-into-view-non-field-errors`;

export function makeFieldErrorDomId(id: Id) {
  return `${domPrefix}-field-error-${id}`;
}

export function makeFieldInputId(definitionId: Id) {
  return `${domPrefix}-input-${definitionId}`;
}

export function makeFormFieldSelectorClass(id: Id) {
  return `${domPrefix}-field-${id}`;
}

type Id = string | number;
