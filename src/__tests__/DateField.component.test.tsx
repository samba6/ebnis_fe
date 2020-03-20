/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import formatDate from "date-fns/format";
import addDays from "date-fns/addDays";
import addYears from "date-fns/addYears";
import addMonths from "date-fns/addMonths";
import { DateField } from "../components/DateField/date-field.component";
import { Props } from "../components/DateField/date-field.utils";
import {
  makeComponentDomId,
  selectedItemClassName,
  makeDayDomId,
  makeMonthDomId,
  makeYearDomId,
  makeYearItemSelector,
  makeMonthItemSelector,
  makeDayItemSelector,
} from "../components/DateField/date-field.dom";

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
  const name = "f";
  const componentId = makeComponentDomId(name);
  const dayFieldDomId = makeDayDomId(componentId);
  const monthFieldDomId = makeMonthDomId(componentId);
  const yearFieldDomId = makeYearDomId(componentId);

  render(
    <DateFieldP value={currentDate} onChange={mockSetValue} name={name} />,
  );

  /**
   * Then today's date should be visible on the page
   */
  const [y, m, d] = formatDate(currentDate, "yyyy MMM d").split(" ");

  const dayFieldDom = document.getElementById(dayFieldDomId) as HTMLDivElement;

  expect(
    (dayFieldDom
      .getElementsByClassName(selectedItemClassName)
      .item(0) as HTMLDivElement).textContent,
  ).toEqual(d);

  const monthFieldDom = document.getElementById(
    monthFieldDomId,
  ) as HTMLDivElement;
  // debug();

  expect(
    (monthFieldDom.getElementsByClassName(
      selectedItemClassName,
    )[0] as HTMLDivElement).textContent,
  ).toEqual(m);

  const yearFieldDom = document.getElementById(
    yearFieldDomId,
  ) as HTMLDivElement;

  expect(
    (yearFieldDom.getElementsByClassName(
      selectedItemClassName,
    )[0] as HTMLDivElement).textContent,
  ).toEqual(y);

  /**
   * When we change the date to two years, 3 months and 5 days ago
   */
  const newDate = addMonths(addDays(addYears(currentDate, -2), -5), -3);
  const [y1, m1, d1] = formatDate(newDate, "yyyy MMM d").split(" ");

  (yearFieldDom
    .getElementsByClassName(makeYearItemSelector(y1))
    .item(0) as HTMLElement).click();

  (monthFieldDom
    .getElementsByClassName(makeMonthItemSelector(m1))
    .item(0) as HTMLElement).click();

  (dayFieldDom
    .getElementsByClassName(makeDayItemSelector(d1))
    .item(0) as HTMLElement).click();

  /**
   * Then the new date should have been set
   */
  expect(
    (yearFieldDom.getElementsByClassName(
      selectedItemClassName,
    )[0] as HTMLDivElement).textContent,
  ).toEqual(y1);

  const [c01, c02] = mockSetValue.mock.calls[0];
  expect(c01).toEqual(name);
  expect(c02.getFullYear()).toBe(currentDate.getFullYear() - 2); // 2 years ago

  expect(
    (monthFieldDom.getElementsByClassName(
      selectedItemClassName,
    )[0] as HTMLDivElement).textContent,
  ).toEqual(m1);

  const [c11, c12] = mockSetValue.mock.calls[1];
  expect(c11).toEqual(name);
  expect(c12.getMonth()).toBe(currentDate.getMonth() - 3); // 3 months ago

  expect(
    (dayFieldDom
      .getElementsByClassName(selectedItemClassName)
      .item(0) as HTMLDivElement).textContent,
  ).toEqual(d1);

  const [c21, c22] = mockSetValue.mock.calls[2];
  expect(c21).toEqual(name);
  expect(c22.getDate()).toBe(currentDate.getDate() - 5); // 5 days ago
});
