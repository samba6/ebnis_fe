export const domPrefix = "new-entry";
export const submitBtnDomId = `${domPrefix}-submit-btn`;
export const networkErrorDomId = `${domPrefix}-network-error`;
export const scrollIntoViewNonFieldErrorDomId = `${domPrefix}-scroll-into-view-non-field-errors`;

export function makeFieldInputId(definitionId: Id) {
  return `${domPrefix}-input-${definitionId}`;
}


export function makeInputErrorDomId(definitionId: Id) {
  return `${domPrefix}-input-error-${definitionId}`;
}

type Id = string | number;
