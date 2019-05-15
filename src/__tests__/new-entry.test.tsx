// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import {
  render,
  fireEvent,
  wait,
  getByText as getDescendantByText,
  getByTestId as getDescendantByTestId
} from "react-testing-library";
import isDateWithinRange from "date-fns/is_within_range";
import addHours from "date-fns/add_hours";
import addDays from "date-fns/add_days";
import formatDate from "date-fns/format";
import differenceInDays from "date-fns/difference_in_days";
import differenceInHours from "date-fns/difference_in_hours";

import { NewEntry } from "../components/NewEntry/component";
import { Props } from "../components/NewEntry/utils";
import { renderWithRouter, fillField } from "./test_utils";
import { GetAnExp_exp } from "../graphql/apollo-types/GetAnExp";
import { FieldType } from "../graphql/apollo-types/globalTypes";

jest.mock("../components/NewEntry/update");
jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null)
}));

import { update as mockUpdate } from "../components/NewEntry/update";

type P = ComponentType<Partial<Props>>;
const NewEntryP = NewEntry as P;
const title = "what lovely experience";

it("renders loading indicator if we have not returned from server", () => {
  /**
   * Given that we have not received experience from server
   */
  const { ui } = makeComp({ getExperienceGql: { loading: true } as any });

  /**
   * While we are on new entry page
   */
  const { getByTestId } = render(ui);

  /**
   * Then we should see loading indicator
   */
  expect(getByTestId("loading-spinner")).toBeInTheDocument();
});

it("renders loading indicator if we get no experience from server", () => {
  /**
   * Given that we have received null experience from server
   */
  const { ui } = makeComp({ getExperienceGql: { exp: null } as any });

  /**
   * While we are on new entry page
   */
  const { getByTestId } = render(ui);

  /**
   * Then we should see loading indicator
   */
  expect(getByTestId("loading-spinner")).toBeInTheDocument();
});

it("creates new experience entry", async () => {
  // an hour earlier
  const now = addHours(new Date(), -1);

  // we will check that date submitted to server is between yesterday
  // and today
  const startDate = addDays(now, -1);
  const endDate = addDays(startDate, 2);

  // we will check that datetime submitted to server is within an hour from now
  const endDatetime = addHours(now, 2);

  /**
   * Given we have received experiences from server
   */
  const exp: GetAnExp_exp = {
    id: "1000",

    title,

    fieldDefs: [
      { id: "f1", name: "f1", type: FieldType.DATE, __typename: "FieldDef" },

      {
        id: "f2",
        name: "f2",
        type: FieldType.DATETIME,
        __typename: "FieldDef"
      },

      { id: "f3", name: "f3", type: FieldType.DECIMAL, __typename: "FieldDef" },

      { id: "f4", name: "f4", type: FieldType.INTEGER, __typename: "FieldDef" },

      {
        id: "f5",
        name: "f5",
        type: FieldType.SINGLE_LINE_TEXT,
        __typename: "FieldDef"
      },

      {
        id: "f6",
        name: "f6",
        type: FieldType.MULTI_LINE_TEXT,
        __typename: "FieldDef"
      }
    ],

    description: "lovely",

    __typename: "Experience"
  };

  const { ui, mockCreateEntry } = makeComp({
    getExperienceGql: { exp } as any
  });

  /**
   * While we are on new entry page
   */
  const { queryByTestId, getByLabelText, getByText } = render(ui);

  /**
   * Then we should not see loading indicator
   */
  expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();

  /**
   * And SINGLE_LINE_TEXT field should be empty
   */
  const $singleText = getByLabelText(
    "f5 [SINGLE_LINE_TEXT]"
  ) as HTMLInputElement;

  expect($singleText.value).toBe("");

  /**
   * And MULTI_LINE_TEXT field should be empty
   */
  const $multiText = getByLabelText("f6 [MULTI_LINE_TEXT]") as HTMLInputElement;

  expect($multiText.value).toBe("");

  /**
   * And DECIMAL field should be empty
   */
  const $decimal = getByLabelText("f3 [DECIMAL]") as HTMLInputElement;

  expect($decimal.value).toBe("");

  /**
   * And INTEGER field should be empty
   */
  const $integer = getByLabelText("f4 [INTEGER]") as HTMLInputElement;

  expect($integer.value).toBe("");

  /**
   * When we complete and submit the form
   */
  fillField($integer, "1");
  fillField($decimal, "2.0");
  fillField($multiText, "m");
  fillField($singleText, "s");

  fireEvent.click(getByText(/submit/i));

  /**
   * Then the correct values should be sent to the server
   */
  await wait(() => {
    const {
      variables: {
        entry: { expId, fields }
      }
    } = mockCreateEntry.mock.calls[0][0] as any;

    expect(expId).toBe("1000");
    expect((mockUpdate as jest.Mock).mock.calls[0][0]).toBe("1000");

    const [f1, f2, f3, f4, f5, f6] = fields;

    expect(f1.defId).toBe("f1");
    expect(
      isDateWithinRange(JSON.parse(f1.data).date, startDate, endDate)
    ).toBe(true);

    expect(f2.defId).toBe("f2");
    expect(
      isDateWithinRange(JSON.parse(f2.data).datetime, now, endDatetime)
    ).toBe(true);

    expect(f3.defId).toBe("f3");
    expect(JSON.parse(f3.data).decimal).toBe("2");

    expect(f4.defId).toBe("f4");
    expect(JSON.parse(f4.data).integer).toBe("1");

    expect(f5.defId).toBe("f5");
    expect(JSON.parse(f5.data).single_line_text).toBe("s");

    expect(f6.defId).toBe("f6");
    expect(JSON.parse(f6.data).multi_line_text).toBe("m");
  });
});

it("sets decimal and integer fields to default to 0", async () => {
  /**
   * Given we have received experiences from server
   */
  const exp = {
    fieldDefs: [
      { id: "f1", name: "f3", type: FieldType.DECIMAL, __typename: "FieldDef" },

      { id: "f2", name: "f4", type: FieldType.INTEGER, __typename: "FieldDef" }
    ]
  } as GetAnExp_exp;

  const { ui, mockCreateEntry } = makeComp({
    getExperienceGql: { exp } as any
  });

  /**
   * While we are on new entry page
   */
  const { getByText } = render(ui);

  /**
   * When we submit the form without making any input
   */
  fireEvent.click(getByText(/submit/i));

  /**
   * Then default values should be sent to the server
   */
  await wait(() => {
    const {
      variables: {
        entry: { fields }
      }
    } = mockCreateEntry.mock.calls[0][0] as any;

    const [f1, f2] = fields;

    expect(JSON.parse(f1.data).decimal).toBe("0");

    expect(JSON.parse(f2.data).integer).toBe("0");
  });
});

it("sets values of date and datetime fields", async () => {
  const now = new Date();

  /**
   * Given we have received experiences from server
   */
  const exp: GetAnExp_exp = {
    id: "1000",

    title,

    fieldDefs: [
      { id: "f1", name: "f1", type: FieldType.DATE, __typename: "FieldDef" },

      {
        id: "f2",
        name: "f2",
        type: FieldType.DATETIME,
        __typename: "FieldDef"
      }
    ],

    description: "lovely",

    __typename: "Experience"
  };

  const { ui, mockCreateEntry } = makeComp({
    getExperienceGql: { exp } as any
  });

  /**
   * While we are on new entry page
   */
  const { getByText, getByTestId } = render(ui);

  /**
   * When we change datetime field to 2 hours ago
   */
  const datetime = addHours(now, -2);
  const [y, m, d, h, mi] = formatDate(datetime, "YYYY MMM D HH mm").split(" ");
  const $datetimeField = getByTestId("datetime-field-fields[1]");
  fireEvent.click(getDescendantByText($datetimeField, y));
  fireEvent.click(getDescendantByText($datetimeField, m));
  fireEvent.click(getDescendantByText($datetimeField, d));
  fireEvent.click(
    getDescendantByText(
      getDescendantByTestId($datetimeField, "fields[1].hr"),
      h
    )
  );
  fireEvent.click(
    getDescendantByText(
      getDescendantByTestId($datetimeField, "fields[1].min"),
      mi
    )
  );

  /**
   * And we change date to 2 days ago
   */
  const date = addDays(now, -2);
  const [y1, m1, d1] = formatDate(date, "YYYY MMM D").split(" ");
  const $dateField = getByTestId("date-field-fields[0]");
  fireEvent.click(getDescendantByText($dateField, y1));
  fireEvent.click(getDescendantByText($dateField, m1));
  fireEvent.click(getDescendantByText($dateField, d1));

  /**
   * And submit the form
   */
  fireEvent.click(getByText(/submit/i));

  /**
   * Then the correct values should be sent to the server
   */
  await wait(() => {
    const {
      variables: {
        entry: { fields }
      }
    } = mockCreateEntry.mock.calls[0][0] as any;

    const [f1, f2] = fields;

    expect(differenceInDays(now, JSON.parse(f1.data).date)).toBe(2);
    expect(differenceInHours(now, JSON.parse(f2.data).datetime)).toBe(2);
  });
});

function makeComp(props: Partial<Props> = { getExperienceGql: {} as any }) {
  const mockCreateEntry = jest.fn();

  const { Ui, ...rest } = renderWithRouter(
    NewEntryP,
    {},
    {
      createEntry: mockCreateEntry,
      ...props
    }
  );

  return {
    ui: <Ui />,
    mockCreateEntry,
    ...rest
  };
}
