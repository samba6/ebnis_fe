/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait, waitForElement } from "react-testing-library";
import isDateWithinRange from "date-fns/is_within_range";
import addHours from "date-fns/add_hours";
import addDays from "date-fns/add_days";
import formatDate from "date-fns/format";
import differenceInDays from "date-fns/difference_in_days";
import differenceInHours from "date-fns/difference_in_hours";

import { NewEntry } from "../components/NewEntry/component";
import { Props, CreateEntryFieldErrors } from "../components/NewEntry/utils";
import { renderWithRouter, fillField, closeMessage } from "./test_utils";
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
  SidebarHeader: () => null,
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

it.only("creates new experience entry when online", async () => {
  // an hour earlier
  const now = addHours(new Date(), -1);

  // we will check that date submitted to server is between yesterday
  // and tomorrow
  const startDate = addDays(now, -1);
  const endDate = addDays(now, 1);

  // we will check that datetime submitted to server is within an hour from now
  const endDatetime = addHours(now, 2);

  /**
   * Given we have received experiences from server
   */
  const experience = {
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
    experience: experience,
  });

  /**
   * While we are on new entry page
   */
  render(ui);

  /**
   * Then SINGLE_LINE_TEXT field should be empty
   */
  const $singleText = document.getElementById(
    "new-entry-SINGLE_LINE_TEXT-input",
  ) as HTMLInputElement;

  expect($singleText.value).toBe("");

  /**
   * And MULTI_LINE_TEXT field should be empty
   */
  const $multiText = document.getElementById(
    "new-entry-MULTI_LINE_TEXT-input",
  ) as HTMLInputElement;

  expect($multiText.value).toBe("");

  /**
   * And DECIMAL field should be empty
   */
  const $decimal = document.getElementById(
    "new-entry-DECIMAL-input",
  ) as HTMLInputElement;

  expect($decimal.value).toBe("");

  /**
   * And INTEGER field should be empty
   */
  const $integer = document.getElementById(
    "new-entry-INTEGER-input",
  ) as HTMLInputElement;

  expect($integer.value).toBe("");

  /**
   * When we complete and submit the form
   */
  fillField($integer, "1");
  fillField($decimal, "2.0");
  fillField($multiText, "m");
  fillField($singleText, "s");

  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

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
  render(ui);

  /**
   * When we submit the form without making any input
   */
  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

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
  render(ui);

  /**
   * When we change datetime field to 2 hours ago
   */
  const datetime = addHours(now, -2);

  const [y, m, d, h, mi] = formatDate(datetime, "YYYY MMM D HH mm").split(" ");

  const $datetimeField = document.getElementById(
    "datetime-field-input-fields[1]",
  ) as HTMLDivElement;

  (document.getElementById(
    `date-field-input-fields[1].date.year-${y}`,
  ) as any).click();

  ($datetimeField.getElementsByClassName(
    `js-date-field-input-month-${m}`,
  )[0] as any).click();

  ($datetimeField.getElementsByClassName(
    `js-date-field-input-day-${d}`,
  )[0] as any).click();

  ($datetimeField.getElementsByClassName(
    `js-datetime-field-input-hour-${h}`,
  )[0] as any).click();

  ($datetimeField.getElementsByClassName(
    `js-datetime-field-input-minute-${mi}`,
  )[0] as any).click();

  /**
   * And we change date to 2 days ago
   */
  const date = addDays(now, -2);
  const [y1, m1, d1] = formatDate(date, "YYYY MMM D").split(" ");

  const $dateField = document.getElementById(
    `date-field-input-fields[0]`,
  ) as HTMLDivElement;

  (document.getElementById(
    `date-field-input-fields[0].year-${y1}`,
  ) as any).click();

  ($dateField.getElementsByClassName(
    `js-date-field-input-month-${m1}`,
  )[0] as any).click();

  ($dateField.getElementsByClassName(
    `js-date-field-input-day-${d1}`,
  )[0] as any).click();

  /**
   * And submit the form
   */
  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

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
  render(ui);

  /**
   * When we complete and submit the form
   */
  const $singleText = document.getElementById(
    "new-entry-SINGLE_LINE_TEXT-input",
  ) as HTMLInputElement;

  fillField($singleText, "s");

  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

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

it("renders error when entry creation fails", async () => {
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

  render(ui);

  fillField(
    document.getElementById("new-entry-SINGLE_LINE_TEXT]-input") as any,
    "s",
  );

  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

  const $error = await waitForElement(() =>
    document.getElementById("new-entry-field-error-f1"),
  );

  expect($error).not.toBeNull();

  expect(mockNavigate).not.toHaveBeenCalled();

  expect(mockScrollIntoView).toHaveBeenCalled();
});

it("renders network error", async () => {
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

  render(ui);

  fillField(
    document.getElementById("new-entry-[SINGLE_LINE_TEXT]-input") as any,
    "s",
  );

  expect(document.getElementById("new-entry-network-error")).toBeNull;

  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

  const $error = await waitForElement(
    () => document.getElementById("new-entry-network-error") as HTMLDivElement,
  );

  expect(mockNavigate).not.toHaveBeenCalled();
  expect(mockScrollIntoView).toHaveBeenCalled();

  closeMessage($error);

  expect(document.getElementById("new-entry-network-error")).toBeNull();
});

it("treats non field graphql errors as network error", async () => {
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

  render(ui);

  fillField(
    document.getElementById("new-entry-[SINGLE_LINE_TEXT]-input") as any,
    "s",
  );

  expect(document.getElementById("new-entry-network-error")).toBeNull();

  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

  const $error = await waitForElement(
    () => document.getElementById("new-entry-network-error") as any,
  );

  expect(mockNavigate).not.toHaveBeenCalled();
  expect(mockScrollIntoView).toHaveBeenCalled();

  closeMessage($error);

  expect(document.getElementById("new-entry-network-error")).toBeNull();
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
