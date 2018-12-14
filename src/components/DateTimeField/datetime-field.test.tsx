import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";
import { getByText as domGetByText } from "dom-testing-library";

import DatetimeField from "./index";
import { getFieldName } from "./datetime-field";
import { MONTH_LABELS } from "../DateField/date-field";

function nextTime(curr: number, max: number) {
  let next = curr + 1;
  next = next > max ? 2 : next;

  return [next, (next + "").padStart(2, "0")] as [number, string];
}

it("renders", () => {
  const compName = "datetime1";
  const setValueMock = jest.fn();
  const today = new Date();
  const currHr = today.getHours();
  const currMin = today.getMinutes();
  const currMonth = today.getMonth();

  const { getByTestId } = render(
    <DatetimeField name={compName} value={today} setValue={setValueMock} />
  );

  const hrName = getFieldName(compName, "hr");
  const $hr = getByTestId(hrName);
  expect($hr.getAttribute("name")).toBe(hrName);

  const [nextHr, nextHrText] = nextTime(currHr, 23);
  const $nextHr = domGetByText($hr, nextHrText);
  const nextDatetime0 = new Date(today);
  nextDatetime0.setHours(nextHr);
  fireEvent.click($nextHr);
  expect(setValueMock.mock.calls[0]).toEqual([compName, nextDatetime0]);

  const minName = getFieldName(compName, "min");
  const $min = getByTestId(minName);
  expect($min.getAttribute("name")).toBe(minName);

  const [nextMin, nextMinText] = nextTime(currMin, 59);
  const $nextMin = domGetByText($min, nextMinText);
  const nextDatetime1 = new Date(nextDatetime0);
  nextDatetime1.setMinutes(nextMin);
  fireEvent.click($nextMin);
  expect(setValueMock.mock.calls[1]).toEqual([compName, nextDatetime1]);

  const dateName = getFieldName(compName, "date");
  const [nextMonth] = nextTime(currMonth, 11);
  const nextMonthText = MONTH_LABELS[nextMonth];
  const $nextMonth = domGetByText(
    getByTestId(`date-field-${dateName}`),
    nextMonthText
  );
  const nextDatetime2 = new Date(nextDatetime1);
  nextDatetime2.setMonth(nextMonth);
  nextDatetime2.setSeconds(0);
  nextDatetime2.setMilliseconds(0);
  fireEvent.click($nextMonth);
  expect(setValueMock.mock.calls[2]).toEqual([compName, nextDatetime2]);
});
