/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import {
  render,
  fireEvent,
  wait,
  waitForElement,
} from "@testing-library/react";
import addHours from "date-fns/addHours";
import addDays from "date-fns/addDays";
import formatDate from "date-fns/format";
import differenceInDays from "date-fns/differenceInDays";
import differenceInHours from "date-fns/differenceInHours";
import parseISO from "date-fns/parseISO";
import { NewEntryComponent } from "../components/NewEntry/new-entry.component";
import { NewEntryComponentProps } from "../components/NewEntry/new-entry.utils";
import {
  renderWithRouter,
  fillField,
  closeMessage,
  ToVariables,
  ToData,
} from "./test_utils";
import {
  DataTypes,
  CreateDataObject,
} from "../graphql/apollo-types/globalTypes";
import {
  ExperienceFragment_entries,
  ExperienceFragment,
  ExperienceFragment_dataDefinitions,
} from "../graphql/apollo-types/ExperienceFragment";
import { ApolloError } from "apollo-client";
import {
  CreateOnlineEntryMutation_createEntry_errors,
  CreateOnlineEntryMutation,
  CreateOnlineEntryMutationVariables,
} from "../graphql/apollo-types/CreateOnlineEntryMutation";
import { isConnected } from "../state/connections";
import { scrollIntoView } from "../components/scroll-into-view";
import {
  CreateOfflineEntryMutationVariables,
  CreateOfflineEntryMutationReturned,
} from "../components/NewEntry/new-entry.resolvers";
import { GraphQLError } from "graphql";
import { updateExperienceWithNewEntry } from "../components/NewEntry/new-entry.injectables";
import { cleanupRanQueriesFromCache } from "../apollo-cache/cleanup-ran-queries-from-cache";

jest.mock("../state/connections");
jest.mock("../components/scroll-into-view");
jest.mock("../components/NewEntry/new-entry.injectables");

jest.mock("../components/SidebarHeader/sidebar-header.component", () => ({
  SidebarHeader: jest.fn(() => null),
}));

jest.mock("../components/use-delete-cached-queries-mutations-on-unmount");

jest.mock("../apollo-cache/cleanup-ran-queries-from-cache");
const mockCleanupRanQueriesFromCache = cleanupRanQueriesFromCache as jest.Mock;

const mockIsConnected = isConnected as jest.Mock;
const mockUpdate = updateExperienceWithNewEntry as jest.Mock;
const mockScrollIntoView = scrollIntoView as jest.Mock;

beforeEach(() => {
  mockScrollIntoView.mockReset();
  mockIsConnected.mockReset();
  mockUpdate.mockReset();
  mockCleanupRanQueriesFromCache.mockReset();
});

const title = "ww";

it("creates new experience entry when online", async () => {
  /**
   * Given we have received experiences from server
   */
  const experience = {
    id: "1",

    title,

    dataDefinitions: [
      {
        id: "f3",
        name: "f3",
        type: DataTypes.DECIMAL,
      },

      {
        id: "f4",
        name: "f4",
        type: DataTypes.INTEGER,
      },
    ] as ExperienceFragment_dataDefinitions[],

    description: "lovely",

    entries: {} as ExperienceFragment_entries,
  } as ExperienceFragment;

  const { ui, mockCreateOnlineEntry } = makeComp({
    experience: experience,
  });

  /**
   * While we are on new entry page
   */
  const { unmount } = render(ui);

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

  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

  /**
   * Then the correct values should be sent to the server
   */
  await wait(() => {
    const {
      variables: {
        input: { experienceId, dataObjects },
      },
    } = mockCreateOnlineEntry.mock.calls[0][0] as ToVariables<
      CreateOnlineEntryMutationVariables
    >;

    expect(experienceId).toBe("1");
    expect((mockUpdate as jest.Mock).mock.calls[0][0]).toBe("1");

    const [f3, f4] = dataObjects as CreateDataObject[];

    expect(f3.definitionId).toBe("f3");
    expect(JSON.parse(f3.data).decimal).toBe("2");

    expect(f4.definitionId).toBe("f4");
    expect(JSON.parse(f4.data).integer).toBe("1");
  });

  /**
   * And cleanup codes should not have ran
   */

  expect(mockCleanupRanQueriesFromCache).not.toHaveBeenCalled();

  /**
   * When component is unmounted
   */
  unmount();

  /**
   * Then cleanup codes should run
   */
  expect(mockCleanupRanQueriesFromCache).toHaveBeenCalledTimes(1);
});

it("sets decimal and integer fields to default to 0", async () => {
  /**
   * Given we have received experiences from server
   */
  const exp = {
    dataDefinitions: [
      {
        id: "f1",
        name: "f3",
        type: DataTypes.DECIMAL,
      },

      {
        id: "f2",
        name: "f4",
        type: DataTypes.INTEGER,
      },
    ] as ExperienceFragment_dataDefinitions[],
  } as ExperienceFragment;

  const { ui, mockCreateOnlineEntry, mockNavigate } = makeComp({
    experience: exp,
  });

  mockCreateOnlineEntry.mockResolvedValue({
    data: {
      createEntry: {
        entry: {},
      },
    },
  } as ToData<CreateOnlineEntryMutation>);

  /**
   * While we are on new entry page
   */
  render(ui);

  /**
   * When we submit the form without making any input
   */
  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

  await wait(() => {
    expect(mockNavigate).toHaveBeenCalled();
  });

  /**
   * Then default values should be sent to the server
   */

  const {
    variables: {
      input: { dataObjects },
    },
  } = mockCreateOnlineEntry.mock.calls[0][0] as ToVariables<
    CreateOnlineEntryMutationVariables
  >;

  const [f1, f2] = dataObjects as CreateDataObject[];

  expect(JSON.parse(f1.data).decimal).toBe("0");

  expect(JSON.parse(f2.data).integer).toBe("0");
});

it("sets values of date and datetime fields", async () => {
  const now = new Date();

  /**
   * Given we have received experiences from server
   */
  const experience = {
    id: "1",

    title,

    dataDefinitions: [
      {
        id: "f1",
        name: "f1",
        type: DataTypes.DATE,
      },

      {
        id: "f2",
        name: "f2",
        type: DataTypes.DATETIME,
      },
    ] as ExperienceFragment_dataDefinitions[],

    description: "lovely",

    entries: {} as ExperienceFragment_entries,
  } as ExperienceFragment;

  const { ui, mockCreateOnlineEntry } = makeComp({
    experience: experience,
  });

  /**
   * While we are on new entry page
   */
  render(ui);

  /**
   * When we change datetime field to 2 hours ago
   */
  const datetime = addHours(now, -2);

  const [y, m, d, h, mi] = formatDate(datetime, "yyyy MMM d HH mm").split(" ");

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
  const [y1, m1, d1] = formatDate(date, "yyyy MMM d").split(" ");

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
        input: { dataObjects },
      },
    } = mockCreateOnlineEntry.mock.calls[0][0] as ToVariables<
      CreateOnlineEntryMutationVariables
    >;

    const [f1, f2] = dataObjects as CreateDataObject[];

    expect(f1.definitionId).toBe("f1");

    expect(f2.definitionId).toBe("f2");

    expect(differenceInDays(now, parseISO(JSON.parse(f1.data).date))).toBe(2);

    expect(
      differenceInHours(now, parseISO(JSON.parse(f2.data).datetime)),
    ).toBeGreaterThanOrEqual(1);
  });
});

it("creates new entry when offline", async () => {
  /**
   * Given we have received experiences from server
   */
  const exp = {
    id: "1",

    title,

    dataDefinitions: [
      {
        id: "f1",
        name: "f1",
        type: DataTypes.SINGLE_LINE_TEXT,
      },
    ],

    entries: {},
  };

  const {
    ui,
    mockCreateOfflineEntry,
    mockCreateOnlineEntry,
    mockNavigate,
  } = makeComp(
    {
      experience: exp as any,
    },
    false,
  );

  mockCreateOfflineEntry.mockResolvedValue({
    data: {
      createOfflineEntry: {
        entry: {},
      },
    } as CreateOfflineEntryMutationReturned,
  });

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

  expect($singleText.value).toBe("");

  fillField($singleText, "s");

  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

  await wait(() => {
    expect(mockNavigate).toHaveBeenCalled();
  });

  /**
   * Then the correct values should be saved locally
   */

  const {
    variables: { experience, dataObjects },
  } = mockCreateOfflineEntry.mock.calls[0][0] as ToVariables<
    CreateOfflineEntryMutationVariables
  >;

  expect(experience.id).toBe("1");

  const [f1] = dataObjects as CreateDataObject[];

  expect(f1.definitionId).toBe("f1");
  expect(JSON.parse(f1.data).single_line_text).toBe("s");

  /**
   * No values should be uploaded to the server
   */
  expect(mockCreateOnlineEntry).not.toBeCalled();
});

it("renders error when entry creation fails", async () => {
  const experience = {
    id: "1",
    title,
    dataDefinitions: [
      {
        id: "f1",
        name: "f1",
        type: DataTypes.MULTI_LINE_TEXT,
      },
    ],
    entries: {},
  } as ExperienceFragment;

  const { ui, mockCreateOnlineEntry, mockNavigate } = makeComp({
    experience,
  });

  const errors = {
    dataObjectsErrors: [
      {
        index: 0,
        errors: {
          data: "is invalid",
          definitionId: "f1",
          __typename: "DataObjectError",
        },
      },
    ],
  } as CreateOnlineEntryMutation_createEntry_errors;

  mockCreateOnlineEntry.mockResolvedValue({
    data: {
      createEntry: { errors },
    } as CreateOnlineEntryMutation,
  });

  render(ui);

  const $multiText = document.getElementById(
    "new-entry-MULTI_LINE_TEXT-input",
  ) as HTMLInputElement;

  expect($multiText.value).toBe("");

  fillField($multiText, "s");

  fireEvent.click(document.getElementById("new-entry-submit-btn") as any);

  const $error = await waitForElement(() =>
    document.getElementById("new-entry-field-error-f1"),
  );

  expect($error).not.toBeNull();

  const {
    variables: {
      input: { experienceId, dataObjects },
    },
  } = mockCreateOnlineEntry.mock.calls[0][0] as {
    variables: CreateOnlineEntryMutationVariables;
  };

  expect(experienceId).toBe("1");

  const [f1] = dataObjects as CreateDataObject[];

  expect(f1.definitionId).toBe("f1");
  expect(JSON.parse(f1.data).multi_line_text).toBe("s");

  expect(mockNavigate).not.toHaveBeenCalled();

  expect(mockScrollIntoView).toHaveBeenCalled();
});

it("renders network error", async () => {
  const experience = {
    id: "1",

    title,

    dataDefinitions: [
      {
        id: "f1",
        name: "f1",
        type: DataTypes.SINGLE_LINE_TEXT,
      },
    ],

    entries: {},
  } as ExperienceFragment;

  const { ui, mockCreateOnlineEntry, mockNavigate } = makeComp({
    experience,
  });

  mockCreateOnlineEntry.mockRejectedValue(
    new ApolloError({
      networkError: new Error(),
    }),
  );

  render(ui);

  fillField(
    document.getElementById("new-entry-SINGLE_LINE_TEXT-input") as any,
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
    id: "1",

    title,

    dataDefinitions: [
      {
        id: "f1",
        name: "f1",
        type: DataTypes.SINGLE_LINE_TEXT,
      },
    ],

    entries: {},
  } as ExperienceFragment;

  const { ui, mockCreateOnlineEntry, mockNavigate } = makeComp({
    experience,
  });

  mockCreateOnlineEntry.mockRejectedValue(
    new ApolloError({
      graphQLErrors: [new GraphQLError("error")],
    }),
  );

  render(ui);

  fillField(
    document.getElementById("new-entry-SINGLE_LINE_TEXT-input") as any,
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

const NewEntryP = NewEntryComponent as ComponentType<
  Partial<NewEntryComponentProps>
>;

function makeComp(
  props: Partial<NewEntryComponentProps>,
  connectionStatus: boolean = true,
) {
  mockIsConnected.mockReturnValue(connectionStatus);
  const mockCreateOnlineEntry = jest.fn();
  const mockCreateOfflineEntry = jest.fn();

  const { Ui, ...rest } = renderWithRouter(NewEntryP);

  return {
    ui: (
      <Ui
        createOfflineEntry={mockCreateOfflineEntry}
        createOnlineEntry={mockCreateOnlineEntry}
        {...props}
      />
    ),
    mockCreateOnlineEntry,
    mockCreateOfflineEntry,
    ...rest,
  };
}
