const domPrefix = "ebnis-date-field";
const datetimeDomPrefix = "ebnis-datetime-field";
export const selectedItemClassName = `${domPrefix}-item-selected`;
export const dayDropdownSelector = `js-${domPrefix}-day`;
export const monthDropdownSelector = `js-${domPrefix}-month`;
export const yearDropdownSelector = `js-${domPrefix}-year`;
export const hourDropdownSelector = `js-${domPrefix}-hour`;
export const minuteDropdownSelector = `js-${domPrefix}-minute`;

export function makeMonthItemSelector(month: string) {
  return `js-${domPrefix}-month-${month}`;
}

export function makeDayItemSelector(dayIndex: number | string) {
  return `js-${domPrefix}-day-${dayIndex}`;
}

export function makeYearItemSelector(year: number | string) {
  return `js-${domPrefix}-year-${year}`;
}

export function makeHourItemSelector(hour: number | string) {
  return `js-${datetimeDomPrefix}-hour-${hour}`;
}

export function makeMinuteItemSelector(minutes: number | string) {
  return `js-${datetimeDomPrefix}-minute-${minutes}`;
}
