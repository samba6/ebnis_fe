export const domPrefix = "edit-entry";
export const formErrorsDomId = `${domPrefix}-form-errors-message`;
export const otherErrorsDomId = `${domPrefix}-other-errors-message`;
export const apolloErrorsDomId = `${domPrefix}-apollo-errors-message`;
export const scrollToTopId = `${domPrefix}-scroll-to-top`;

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
