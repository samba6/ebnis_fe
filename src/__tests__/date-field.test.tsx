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

import { DateField } from "../components/DateField/date-field-x";
import { Props } from "../components/DateField/date-field";

type P = ComponentType<Partial<Props>>;
const DateFieldP = DateField as P;

it("renders ", () => {
  const mockSetValue = jest.fn();

  // lets hard code the minutes otherwise the test will fail at xy:00 hours
  // we also hard code the hour otherwise test will fail at 00:xy hours
  // well we need to hard code the day also otherwise failure on the 30th
  const currentDate = new Date("2019-05-28T07:25");

  /**
   * Given that we want the component to render today's date
   */
  const { getByTestId } = render(
    <DateFieldP value={currentDate} setValue={mockSetValue} name="f" />
  );

  /**
   * Then today's date should be visible on the page
   */
  const [y, m, d] = formatDate(currentDate, "YYYY MMM D").split(" ");
  const $day = getByTestId("f.day");

  expect(($day.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    d
  );

  const $month = getByTestId("f.month");
  expect(($month.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    m
  );

  const $year = getByTestId("f.year");
  expect(($year.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    y
  );

  /**
   * When we change the date to two years, 3 months and 5 days ago
   */
  const newDate = addMonths(addDays(addYears(currentDate, -2), -5), -3);
  const [y1, m1, d1] = formatDate(newDate, "YYYY MMM D").split(" ");
  fireEvent.click(getDescendantByText($year, y1));
  fireEvent.click(getDescendantByText($month, m1));
  fireEvent.click(getDescendantByText($day, d1));

  /**
   * Then the new date should have been set
   */
  expect(($year.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    y1
  );
  const [c01, c02] = mockSetValue.mock.calls[0];
  expect(c01).toEqual("f");
  expect(c02.getFullYear()).toBe(currentDate.getFullYear() - 2); // 2 years ago

  expect(($month.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    m1
  );
  const [c11, c12] = mockSetValue.mock.calls[1];
  expect(c11).toEqual("f");
  expect(c12.getMonth()).toBe(currentDate.getMonth() - 3); // 3 months ago

  expect(($day.querySelector(".active") as HTMLDivElement).innerHTML).toMatch(
    d1
  );
  const [c21, c22] = mockSetValue.mock.calls[2];
  expect(c21).toEqual("f");
  expect(c22.getDate()).toBe(currentDate.getDate() - 5); // 5 days ago
});
