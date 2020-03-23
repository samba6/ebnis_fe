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

  /**
   * To prevent test failure at xy:00 hours, 00:xy hours and 30th of the month,
   * we hard code minutes, hours and day respectively
   */
  const testDate = new Date("2019-05-28T07:25");
  const name = "f";
  const componentId = makeComponentDomId(name);
  const dayFieldDomId = makeDayDomId(componentId);
  const monthFieldDomId = makeMonthDomId(componentId);
  const yearFieldDomId = makeYearDomId(componentId);

  /**
   * Given that we want the component to render today's date
   */
  render(<DateFieldP value={testDate} onChange={mockSetValue} name={name} />);

  /**
   * Then today's date should be visible on the page
   */
  const [y, m, d] = formatDate(testDate, "yyyy MMM d").split(" ");

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
  const newDate = addMonths(addDays(addYears(testDate, -2), -5), -3);
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
  expect(c02.getFullYear()).toBe(testDate.getFullYear() - 2); // 2 years ago

  expect(
    (monthFieldDom.getElementsByClassName(
      selectedItemClassName,
    )[0] as HTMLDivElement).textContent,
  ).toEqual(m1);

  const [c11, c12] = mockSetValue.mock.calls[1];
  expect(c11).toEqual(name);
  expect(c12.getMonth()).toBe(testDate.getMonth() - 3); // 3 months ago

  expect(
    (dayFieldDom
      .getElementsByClassName(selectedItemClassName)
      .item(0) as HTMLDivElement).textContent,
  ).toEqual(d1);

  const [c21, c22] = mockSetValue.mock.calls[2];
  expect(c21).toEqual(name);
  expect(c22.getDate()).toBe(testDate.getDate() - 5); // 5 days ago
});
