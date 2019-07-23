/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import formatDate from "date-fns/format";
import addDays from "date-fns/add_days";
import addYears from "date-fns/add_years";
import addMonths from "date-fns/add_months";
import addMinutes from "date-fns/add_minutes";
import addHours from "date-fns/add_hours";

import { DateTimeField } from "../components/DateTimeField/component";
import { Props } from "../components/DateTimeField/utils";

type P = ComponentType<Partial<Props>>;
const DateTimeFieldP = DateTimeField as P;

it("renders ", () => {
  const mockSetValue = jest.fn();

  // lets hard code the minutes otherwise the test will fail at xy:00 hours
  // we also hard code the hour otherwise test will fail at 00:xy hours
  // well we need to hard code the day also otherwise failure on the 30th
  const currentDate = new Date("2019-05-28T07:25");

  /**
   * Given that we want the component to render a date
   */
  render(
    <DateTimeFieldP value={currentDate} setValue={mockSetValue} name="f" />,
  );

  /**
   * Then the date should be visible on the page
   */
  const [y, m, d, h, mi] = formatDate(currentDate, "YYYY MMM D HH mm").split(
    " ",
  );

  const $day = document.getElementById(
    "date-field-input-f.date.day",
  ) as HTMLDivElement;

  expect(($day.getElementsByClassName("active")[0] as any).textContent).toEqual(
    d,
  );

  const $month = document.getElementById(
    `date-field-input-f.date.month`,
  ) as HTMLDivElement;

  expect(
    ($month.getElementsByClassName("active")[0] as any).textContent,
  ).toEqual(m);

  const $year = document.getElementById(
    "date-field-input-f.date.year",
  ) as HTMLDivElement;

  expect(
    ($year.getElementsByClassName("active")[0] as any).textContent,
  ).toEqual(y);

  const $hr = document.getElementById(
    `datetime-hour-field-f.hr`,
  ) as HTMLDivElement;

  expect(($hr.getElementsByClassName("active")[0] as any).textContent).toEqual(
    h,
  );

  const $min = document.getElementById(
    `datetime-minute-field-f.min`,
  ) as HTMLDivElement;

  expect(($min.getElementsByClassName("active")[0] as any).textContent).toEqual(
    mi,
  );

  /**
   * When we change the date to two years, 3 months, 5 days, 2 hours and
   * 4 minutes ago
   */
  const newDate = addMinutes(
    addHours(addMonths(addDays(addYears(currentDate, -2), -5), -3), -2),
    -4,
  );

  const [y1, m1, d1, h1, mi1] = formatDate(newDate, "YYYY MMM D HH mm").split(
    " ",
  );

  (document.getElementById(
    `date-field-input-f.date.year-${y1}`,
  ) as any).click();

  ($month.getElementsByClassName(
    `js-date-field-input-month-${m1}`,
  )[0] as any).click();

  ($day.getElementsByClassName(
    `js-date-field-input-day-${d1}`,
  )[0] as any).click();

  (document.getElementsByClassName(
    `js-datetime-field-input-hour-${h1}`,
  )[0] as any).click();

  (document.getElementsByClassName(
    `js-datetime-field-input-minute-${mi1}`,
  )[0] as any).click();

  /**
   * Then the new date should have been set
   */
  expect(
    ($year.getElementsByClassName("active")[0] as HTMLDivElement).textContent,
  ).toEqual(y1);

  const [c01, c02] = mockSetValue.mock.calls[0];
  expect(c01).toEqual("f");
  expect(c02.getFullYear()).toBe(currentDate.getFullYear() - 2); // 2 years ago

  expect(
    ($month.getElementsByClassName("active")[0] as HTMLDivElement).textContent,
  ).toEqual(m1);

  const [c11, c12] = mockSetValue.mock.calls[1];
  expect(c11).toEqual("f");
  expect(c12.getMonth()).toBe(currentDate.getMonth() - 3); // 3 months ago

  expect(
    ($day.getElementsByClassName("active")[0] as HTMLDivElement).textContent,
  ).toEqual(d1);

  const [c21, c22] = mockSetValue.mock.calls[2];
  expect(c21).toEqual("f");
  expect(c22.getDate()).toBe(currentDate.getDate() - 5); // 5 days ago

  expect(
    ($hr.getElementsByClassName("active")[0] as HTMLDivElement).textContent,
  ).toEqual(h1);

  const [c31, c32] = mockSetValue.mock.calls[3];
  expect(c31).toEqual("f");
  expect(c32.getHours()).toBe(currentDate.getHours() - 2); // 2 hours ago

  expect(
    ($min.getElementsByClassName("active")[0] as HTMLDivElement).textContent,
  ).toEqual(mi1);

  const [c41, c42] = mockSetValue.mock.calls[4];
  expect(c41).toEqual("f");
  expect(c42.getMinutes()).toBe(currentDate.getMinutes() - 4); // 4 minutes ago
});
