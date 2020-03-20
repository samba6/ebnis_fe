/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import formatDate from "date-fns/format";
import addDays from "date-fns/addDays";
import addYears from "date-fns/addYears";
import addMonths from "date-fns/addMonths";
import addMinutes from "date-fns/addMinutes";
import addHours from "date-fns/addHours";

import { DateTimeField } from "../components/DateTimeField/date-time-field.component";
import { Props } from "../components/DateTimeField/date-time-field.utils";
import { selectedItemClassName } from "../components/DateField/date-field.dom";

type P = ComponentType<Partial<Props>>;
const DateTimeFieldP = DateTimeField as P;

it("renders ", () => {
  const mockSetValue = jest.fn();

  // lets hard code the minutes otherwise the test will fail at xy:00 hours
  // we also hard code the hour otherwise test will fail at 00:xy hours
  // well we need to hard code the day also otherwise failure on the 30th
  const currentDate = new Date("2019-05-28T07:25");

  const name = "f";

  /**
   * Given that we want the component to render a date
   */
  render(
    <DateTimeFieldP value={currentDate} onChange={mockSetValue} name={name} />,
  );

  /**
   * Then the date should be visible on the page
   */
  const [, , , h, mi] = formatDate(currentDate, "yyyy MMM d HH mm").split(" ");

  const hourFieldDom = document.getElementById(
    `datetime-hour-field-f.hr`,
  ) as HTMLDivElement;

  expect(
    (hourFieldDom
      .getElementsByClassName(selectedItemClassName)
      .item(0) as HTMLElement).textContent,
  ).toEqual(h);

  const minuteFieldDom = document.getElementById(
    `datetime-minute-field-f.min`,
  ) as HTMLDivElement;

  expect(
    (minuteFieldDom
      .getElementsByClassName(selectedItemClassName)
      .item(0) as HTMLElement).textContent,
  ).toEqual(mi);

  /**
   * When we change the date to two years, 3 months, 5 days, 2 hours and
   * 4 minutes ago
   */
  const newDate = addMinutes(
    addHours(addMonths(addDays(addYears(currentDate, -2), -5), -3), -2),
    -4,
  );

  const [, , , h1, mi1] = formatDate(newDate, "yyyy MMM d HH mm").split(" ");

  (document
    .getElementsByClassName(`js-datetime-field-input-hour-${h1}`)
    .item(0) as HTMLElement).click();

  (document
    .getElementsByClassName(`js-datetime-field-input-minute-${mi1}`)
    .item(0) as HTMLElement).click();

  /**
   * Then the new date should have been set
   */
  const calls = mockSetValue.mock.calls;

  const [c01, c02] = calls[0];
  expect(c01).toEqual(name);
  expect(c02.getHours()).toBe(currentDate.getHours() - 2); // 2 hours ago

  expect(
    (hourFieldDom
      .getElementsByClassName(selectedItemClassName)
      .item(0) as HTMLDivElement).textContent,
  ).toEqual(h1);

  const [, c1] = calls[1];
  expect(c1.getMinutes()).toBe(currentDate.getMinutes() - 4); // 4 minutes ago

  expect(
    (minuteFieldDom
      .getElementsByClassName(selectedItemClassName)
      .item(0) as HTMLDivElement).textContent,
  ).toEqual(mi1);
});
