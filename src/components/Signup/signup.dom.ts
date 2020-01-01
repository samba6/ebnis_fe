export const domPrefix = "sign-up";

export function makeFormFieldSelectorClass(name: string) {
  return `js-${domPrefix}-field-${name}`;
}
