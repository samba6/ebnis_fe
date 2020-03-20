const domPrefix = "ebnis-date-field";
export const selectedItemClassName = `${domPrefix}-item-selected`;

export function makeComponentDomId(name: string) {
  return `${domPrefix}-${name}`;
}

export function makeMonthItemSelector(month: string) {
  return `js-${domPrefix}-month-${month}`;
}

export function makeDayItemSelector(dayIndex: number | string) {
  return `js-${domPrefix}-day-${dayIndex}`;
}

export function makeYearItemSelector(year: number | string) {
  return `js-${domPrefix}-year-${year}`;
}

export function makeDayDomId(compId: string) {
  return `${compId}-day`;
}

export function makeMonthDomId(compId: string) {
  return `${compId}-month`;
}

export function makeYearDomId(compId: string) {
  return `${compId}-year`;
}
