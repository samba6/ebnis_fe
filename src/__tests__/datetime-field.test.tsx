// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import {
  render,
  getByText as getDescendantByText,
  fireEvent
} from "react-testing-library";
import formatDate from "date-fns/format";
import addDays from "date-fns/add_days";
import addYears from "date-fns/add_years";
import addMonths from "date-fns/add_months";
import addMinutes from "date-fns/add_minutes";
import addHours from "date-fns/add_hours";
import setMinutes from "date-fns/set_minutes";
import setHours from "date-fns/set_hours";

import { DateTimeField } from "../components/DateTimeField/datetime-field-x";
import { Props } from "../components/DateTimeField/datetime-field";

type P = ComponentType<Partial<Props>>;
const DateTimeFieldP = DateTimeField as P;

it("renders ", () => {
  const mockSetValue = jest.fn();

  // lets hard code the minutes otherwise the test will fail at xy:00 hours
  // we also hard code the hour otherwise test will fail at 00:xy hours
  const today = setHours(setMinutes(new Date(), 25), 7);

  /**
   * Given that we want the component to render a date
   */
  const { getByTestId } = render(
    <DateTimeFieldP value={today} setValue={mockSetValue} name="f" />
  );

  /**
   * Then the date should be visible on the page
   */
  const [y, m, d, h, mi] = formatDate(today, "YYYY MMM D HH mm").split(" ");
  const $day = getByTestId("f.date.day");

  expect(($day.querySelector(".active") as any).innerHTML).toMatch(d);

  const $month = getByTestId("f.date.month");
  expect(($month.querySelector(".active") as any).innerHTML).toMatch(m);

  const $year = getByTestId("f.date.year");
  expect(($year.querySelector(".active") as any).innerHTML).toMatch(y);

  const $hr = getByTestId("f.hr");
  expect(($hr.querySelector(".active") as any).innerHTML).toMatch(h);

  const $min = getByTestId("f.min");
  expect(($min.querySelector(".active") as any).innerHTML).toMatch(mi);

  /**
   * When we change the date to two years, 3 months, 5 days, 2 hours and
   * 4 minutes ago
   */
  const newDate = addMinutes(
    addHours(addMonths(addDays(addYears(today, -2), -5), -3), -2),
    -4
  );

  const [y1, m1, d1, h1, mi1] = formatDate(newDate, "YYYY MMM D HH mm").split(
    " "
  );
  fireEvent.click(getDescendantByText($year, y1));
  fireEvent.click(getDescendantByText($month, m1));
  fireEvent.click(getDescendantByText($day, d1));
  fireEvent.click(getDescendantByText($hr, h1));
  fireEvent.click(getDescendantByText($min, mi1));

  /**
   * Then the new date should have been set
   */
  expect(($year.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    y1
  );
  const [c01, c02] = mockSetValue.mock.calls[0];
  expect(c01).toEqual("f");
  expect(c02.getFullYear()).toBe(today.getFullYear() - 2); // 2 years ago

  expect(($month.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    m1
  );
  const [c11, c12] = mockSetValue.mock.calls[1];
  expect(c11).toEqual("f");
  expect(c12.getMonth()).toBe(today.getMonth() - 3); // 3 months ago

  expect(($day.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    d1
  );
  const [c21, c22] = mockSetValue.mock.calls[2];
  expect(c21).toEqual("f");
  expect(c22.getDate()).toBe(today.getDate() - 5); // 5 days ago

  expect(($hr.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    h1
  );
  const [c31, c32] = mockSetValue.mock.calls[3];
  expect(c31).toEqual("f");
  expect(c32.getHours()).toBe(today.getHours() - 2); // 2 hours ago

  expect(($min.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    mi1
  );
  const [c41, c42] = mockSetValue.mock.calls[4];
  expect(c41).toEqual("f");
  expect(c42.getMinutes()).toBe(today.getMinutes() - 4); // 4 minutes ago
});
