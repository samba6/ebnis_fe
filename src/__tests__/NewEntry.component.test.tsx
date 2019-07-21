/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import {
  render,
  fireEvent,
  wait,
  getByText as getDescendantByText,
  getByTestId as getDescendantByTestId,
  waitForElement,
} from "react-testing-library";
import isDateWithinRange from "date-fns/is_within_range";
import addHours from "date-fns/add_hours";
import addDays from "date-fns/add_days";
import formatDate from "date-fns/format";
import differenceInDays from "date-fns/difference_in_days";
import differenceInHours from "date-fns/difference_in_hours";

import { NewEntry } from "../components/NewEntry/component";
import { Props, CreateEntryFieldErrors } from "../components/NewEntry/utils";
import { renderWithRouter, fillField } from "./test_utils";
import { FieldType } from "../graphql/apollo-types/globalTypes";
import {
  ExperienceFragment_entries,
  ExperienceFragment,
  ExperienceFragment_fieldDefs,
} from "../graphql/apollo-types/ExperienceFragment";
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";

jest.mock("../components/NewEntry/update");
jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null),
}));
jest.mock("../state/connections");
jest.mock("../components/scroll-into-view");

import { updateExperienceWithNewEntry } from "../components/NewEntry/update";
import { isConnected } from "../state/connections";
import { scrollIntoView } from "../components/scroll-into-view";

const mockIsConnected = isConnected as jest.Mock;
const mockUpdate = updateExperienceWithNewEntry as jest.Mock;
const mockScrollIntoView = scrollIntoView as jest.Mock;

const title = "ww";

it("creates new experience entry when online", async () => {
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
  const exp = {
    id: "1000",

    title,

    fieldDefs: [
      {
        id: "f1",
        name: "f1",
        type: FieldType.DATE,
      },

      {
        id: "f2",
        name: "f2",
        type: FieldType.DATETIME,
      },

      {
        id: "f3",
        name: "f3",
        type: FieldType.DECIMAL,
      },

      {
        id: "f4",
        name: "f4",
        type: FieldType.INTEGER,
      },

      {
        id: "f5",
        name: "f5",
        type: FieldType.SINGLE_LINE_TEXT,
      },

      {
        id: "f6",
        name: "f6",
        type: FieldType.MULTI_LINE_TEXT,
      },
    ] as ExperienceFragment_fieldDefs[],

    description: "lovely",

    entries: {} as ExperienceFragment_entries,
  } as ExperienceFragment;

  const { ui, mockCreateEntry } = makeComp({
    experience: exp,
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
    "[SINGLE_LINE_TEXT] f5",
  ) as HTMLInputElement;

  expect($singleText.value).toBe("");

  /**
   * And MULTI_LINE_TEXT field should be empty
   */
  const $multiText = getByLabelText("[MULTI_LINE_TEXT] f6") as HTMLInputElement;

  expect($multiText.value).toBe("");

  /**
   * And DECIMAL field should be empty
   */
  const $decimal = getByLabelText("[DECIMAL] f3") as HTMLInputElement;

  expect($decimal.value).toBe("");

  /**
   * And INTEGER field should be empty
   */
  const $integer = getByLabelText("[INTEGER] f4") as HTMLInputElement;

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
        input: { expId, fields },
      },
    } = mockCreateEntry.mock.calls[0][0] as any;

    expect(expId).toBe("1000");
    expect((mockUpdate as jest.Mock).mock.calls[0][0]).toBe("1000");

    const [f1, f2, f3, f4, f5, f6] = fields;

    expect(f1.defId).toBe("f1");
    expect(
      isDateWithinRange(JSON.parse(f1.data).date, startDate, endDate),
    ).toBe(true);

    expect(f2.defId).toBe("f2");
    expect(
      isDateWithinRange(JSON.parse(f2.data).datetime, now, endDatetime),
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
      {
        id: "f1",
        name: "f3",
        type: FieldType.DECIMAL,
      },

      {
        id: "f2",
        name: "f4",
        type: FieldType.INTEGER,
      },
    ] as ExperienceFragment_fieldDefs[],
  } as ExperienceFragment;

  const { ui, mockCreateEntry } = makeComp({
    experience: exp,
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
        input: { fields },
      },
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
  const exp = {
    id: "1000",

    title,

    fieldDefs: [
      {
        id: "f1",
        name: "f1",
        type: FieldType.DATE,
      },

      {
        id: "f2",
        name: "f2",
        type: FieldType.DATETIME,
      },
    ] as ExperienceFragment_fieldDefs[],

    description: "lovely",

    entries: {} as ExperienceFragment_entries,
  } as ExperienceFragment;

  const { ui, mockCreateEntry } = makeComp({
    experience: exp,
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
      h,
    ),
  );
  fireEvent.click(
    getDescendantByText(
      getDescendantByTestId($datetimeField, "fields[1].min"),
      mi,
    ),
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
        input: { fields },
      },
    } = mockCreateEntry.mock.calls[0][0] as any;

    const [f1, f2] = fields;

    expect(differenceInDays(now, JSON.parse(f1.data).date)).toBe(2);
    expect(
      differenceInHours(now, JSON.parse(f2.data).datetime),
    ).toBeGreaterThanOrEqual(1);
  });
});

it("creates new experience entry when offline", async () => {
  /**
   * Given we have received experiences from server
   */
  const exp = {
    id: "1000",

    title,

    fieldDefs: [
      {
        id: "f1",
        name: "f1",
        type: FieldType.SINGLE_LINE_TEXT,
      },
    ],

    entries: {},
  };

  const { ui, mockCreateUnsavedEntry, mockCreateEntry } = makeComp(
    {
      experience: exp as any,
    },
    false,
  );

  /**
   * While we are on new entry page
   */
  const { queryByTestId, getByLabelText, getByText } = render(ui);

  /**
   * Then we should not see loading indicator
   */
  expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();

  /**
   * When we complete and submit the form
   */
  const $singleText = getByLabelText(
    "[SINGLE_LINE_TEXT] f1",
  ) as HTMLInputElement;

  fillField($singleText, "s");

  fireEvent.click(getByText(/submit/i));

  /**
   * Then the correct values should be saved locally
   */
  await wait(() => {
    const {
      variables: { experience, fields },
    } = mockCreateUnsavedEntry.mock.calls[0][0] as any;

    expect(experience.id).toBe("1000");

    const [f1] = fields;

    expect(f1.defId).toBe("f1");
    expect(JSON.parse(f1.data).single_line_text).toBe("s");
  });

  /**
   * No values should be uploaded to the server
   */
  expect(mockCreateEntry).not.toBeCalled();
});

it("renders error when entry creation fails", async done => {
  const experience = {
    id: "1000",

    title,

    fieldDefs: [
      {
        id: "f1",
        name: "f1",
        type: FieldType.SINGLE_LINE_TEXT,
      },
    ],

    entries: {},
  } as ExperienceFragment;

  const { ui, mockCreateEntry, mockNavigate } = makeComp({
    experience,
  });

  const graphQLErrorMessage = JSON.stringify({
    fields: [
      {
        errors: { data: "is invalid" },

        meta: { def_id: "f1", index: 0 },
      },
    ],
  } as CreateEntryFieldErrors);

  mockCreateEntry.mockRejectedValue(
    new ApolloError({
      graphQLErrors: [new GraphQLError(graphQLErrorMessage)],
    }),
  );

  const { getByLabelText, getByText, getByTestId } = render(ui);

  fillField(getByLabelText("[SINGLE_LINE_TEXT] f1") as any, "s");

  fireEvent.click(getByText(/submit/i));

  const $error = await waitForElement(() => getByTestId("field-error-f1"));

  expect($error).toBeInTheDocument();

  expect(mockNavigate).not.toHaveBeenCalled();

  expect(mockScrollIntoView).toHaveBeenCalled();

  done();
});

it("renders network error", async done => {
  const experience = {
    id: "1000",

    title,

    fieldDefs: [
      {
        id: "f1",
        name: "f1",
        type: FieldType.SINGLE_LINE_TEXT,
      },
    ],

    entries: {},
  } as ExperienceFragment;

  const { ui, mockCreateEntry, mockNavigate } = makeComp({
    experience,
  });

  mockCreateEntry.mockRejectedValue(
    new ApolloError({
      networkError: new Error(),
    }),
  );

  const { getByLabelText, getByText, getByTestId, queryByTestId } = render(ui);

  fillField(getByLabelText("[SINGLE_LINE_TEXT] f1") as any, "s");

  expect(queryByTestId("network-error")).not.toBeInTheDocument();

  fireEvent.click(getByText(/submit/i));

  const $error = await waitForElement(() => getByTestId("network-error"));

  expect($error).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(mockScrollIntoView).toHaveBeenCalled();

  fireEvent.click($error.querySelector(`.close.icon`) as any);

  expect(queryByTestId("network-error")).not.toBeInTheDocument();

  done();
});

it("treats non field graphql errors as network error", async done => {
  const experience = {
    id: "1000",

    title,

    fieldDefs: [
      {
        id: "f1",
        name: "f1",
        type: FieldType.SINGLE_LINE_TEXT,
      },
    ],

    entries: {},
  } as ExperienceFragment;

  const { ui, mockCreateEntry, mockNavigate } = makeComp({
    experience,
  });

  mockCreateEntry.mockRejectedValue(
    new ApolloError({
      graphQLErrors: [],
    }),
  );

  const { getByLabelText, getByText, getByTestId, queryByTestId } = render(ui);

  fillField(getByLabelText("[SINGLE_LINE_TEXT] f1") as any, "s");

  expect(queryByTestId("network-error")).not.toBeInTheDocument();

  fireEvent.click(getByText(/submit/i));

  const $error = await waitForElement(() => getByTestId("network-error"));

  expect($error).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(mockScrollIntoView).toHaveBeenCalled();

  fireEvent.click($error.querySelector(`.close.icon`) as any);

  expect(queryByTestId("network-error")).not.toBeInTheDocument();

  done();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const NewEntryP = NewEntry as ComponentType<Partial<Props>>;

function makeComp(props: Partial<Props>, connectionStatus: boolean = true) {
  mockScrollIntoView.mockReset();
  mockIsConnected.mockReset();
  mockIsConnected.mockReturnValue(connectionStatus);
  mockUpdate.mockReset();
  const mockCreateEntry = jest.fn();
  const mockCreateUnsavedEntry = jest.fn();

  const { Ui, ...rest } = renderWithRouter(NewEntryP);

  return {
    ui: (
      <Ui
        createEntry={mockCreateEntry}
        createUnsavedEntry={mockCreateUnsavedEntry}
        {...props}
      />
    ),
    mockCreateEntry,
    mockCreateUnsavedEntry,
    ...rest,
  };
}
