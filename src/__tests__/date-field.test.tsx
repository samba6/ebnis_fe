import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";

import DateField from "../components/DateField/index";
import {
  LABELS,
  makeFieldNames,
  MONTH_LABELS,
  getToday,
  getDisplayedDays
} from "../components/DateField/date-field";

it("renders correctly", () => {
  const compName = "date1";
  const today = new Date();
  const { currYr, currMonth, currDay } = getToday(today);
  const fieldName = makeFieldNames(compName);
  const setValueMock = jest.fn();

  const { container, getByText, getByTestId } = render(
    <DateField name={compName} value={today} setValue={setValueMock} />
  );

  const dateField = container.firstChild as HTMLDivElement;

  Object.entries(LABELS).forEach(([key, text]) => {
    const $label = getByText(text);
    expect(dateField).toContainElement($label);
    expect($label.getAttribute("for")).toBe(fieldName[key]);
  });

  const displayedDays = getDisplayedDays(currYr, currMonth);

  const $day = getByTestId(fieldName.day);
  expect($day.getAttribute("name")).toBe(fieldName.day);

  const displayedDaysLen = displayedDays.length - 1;
  const lastDayOfMonth = displayedDays[displayedDaysLen].value;
  let nextDay = currDay + 1;
  nextDay = nextDay > lastDayOfMonth ? 2 : nextDay;

  const $nextDay = getByText(nextDay + "");
  fireEvent.click($nextDay);
  // calls[0] = calledWith(arg1, arg2)
  expect(setValueMock.mock.calls[0]).toEqual([
    compName,
    new Date(currYr, currMonth, nextDay)
  ]);

  const $currDay = getByText(currDay + "");
  fireEvent.click($currDay);
  expect(setValueMock.mock.calls[1]).toEqual([
    compName,
    new Date(currYr, currMonth, currDay)
  ]);

  const $month = getByTestId(fieldName.month);
  expect($month.getAttribute("name")).toBe(fieldName.month);

  let nextMonth = currMonth + 1;
  nextMonth = nextMonth > 11 ? 3 : nextMonth;
  const $nextMonth = getByText(MONTH_LABELS[nextMonth]);
  fireEvent.click($nextMonth);
  expect(setValueMock.mock.calls[2]).toEqual([
    compName,
    new Date(currYr, nextMonth, currDay)
  ]);

  fireEvent.click(getByText(MONTH_LABELS[currMonth]));
  expect(setValueMock.mock.calls[3]).toEqual([
    compName,
    new Date(currYr, currMonth, currDay)
  ]);

  const $year = getByTestId(fieldName.year);
  expect($year.getAttribute("name")).toBe(fieldName.year);

  const nextYr = currYr + 1;
  const $nextYear = getByText(nextYr + "");
  fireEvent.click($nextYear);
  expect(setValueMock.mock.calls[4]).toEqual([
    compName,
    new Date(nextYr, currMonth, currDay)
  ]);
});
