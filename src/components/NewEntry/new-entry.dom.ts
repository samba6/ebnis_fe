export const NEW_ENTRY_DOCUMENT_TITLE_PREFIX = "[New Entry] ";
export const domPrefix = "new-entry";
export const submitBtnDomId = `${domPrefix}-submit-btn`;
export const networkErrorDomId = `${domPrefix}-network-error`;
export const scrollIntoViewNonFieldErrorDomId = `${domPrefix}-scroll-into-view-non-field-errors`;
export const integerInputDomSelector = `js-${domPrefix}-integer-input`;
export const decimalInputDomSelector = `js-${domPrefix}-decimal-input`;
export const singleLineInputDomSelector = `js-${domPrefix}-single-line-input`;
export const multiLineInputDomSelector = `js-${domPrefix}-multi-line-input`;
export const dateComponentDomSelector = `js-${domPrefix}-date-component`;
export const datetimeComponentDomSelector = `js-${domPrefix}-datetime-component`;

export function makeFieldInputId(definitionId: Id) {
  return `${domPrefix}-input-${definitionId}`;
}

export function makeInputErrorDomId(definitionId: Id) {
  return `${domPrefix}-input-error-${definitionId}`;
}

type Id = string | number;
