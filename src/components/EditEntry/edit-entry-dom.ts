export const domPrefix = "edit-entry";
export const editEntryComponentDomId = `${domPrefix}-component`;
export const formErrorsDomId = `${domPrefix}-form-errors-message`;
export const otherErrorsDomId = `${domPrefix}-other-errors-message`;
export const scrollToTopId = `${domPrefix}-scroll-to-top`;
export const editEntrySubmissionResponseDomId = `${domPrefix}-submission-response-message`;
export const editEntrySubmitDomId = `${domPrefix}-submit`;

export enum ControlName {
  edit = "edit",
  dismiss = "dismiss",
  reset = "reset",
  name = "name",
  submit = "submit",
  error = "error",
  input = "input",
}

export function getDataControlDomId(id: Id, control: ControlName) {
  return `${domPrefix}-data-${control}-${id}`;
}

type Id = string | number;
