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
import differenceInDays from "date-fns/differenceInDays";
import differenceInHours from "date-fns/differenceInHours";
import parseISO from "date-fns/parseISO";
import { NewEntryComponent } from "../components/NewEntry/new-entry.component";
import { ComponentProps } from "../components/NewEntry/new-entry.utils";
import { renderWithRouter, fillField } from "./test_utils";
import {
  DataTypes,
  CreateDataObject,
} from "../graphql/apollo-types/globalTypes";
import {
  ExperienceFragment_entries,
  ExperienceFragment,
  ExperienceFragment_dataDefinitions,
} from "../graphql/apollo-types/ExperienceFragment";
import { isConnected } from "../state/connections";
import { scrollIntoView } from "../components/scroll-into-view";
import { cleanupRanQueriesFromCache } from "../apollo-cache/cleanup-ran-queries-from-cache";
import { defaultLoadingDomId } from "../components/Loading/loading-dom";
import {
  submitBtnDomId,
  makeFieldInputId,
  makeInputErrorDomId,
} from "../components/NewEntry/new-entry.dom";
import { Props as DateTimeProps } from "../components/DateTimeField/date-time-field.utils";
import { toISODatetimeString } from "../components/NewEntry/new-entry.utils";
import { UpdateExperiencesOnlineMutationResult } from "../graphql/experiences.gql";

jest.mock("../components/NewEntry/new-entry.injectables");

jest.mock("../components/SidebarHeader/sidebar-header.component", () => ({
  SidebarHeader: jest.fn(() => null),
}));

jest.mock("../components/use-delete-cached-queries-mutations-on-unmount");

jest.mock("../apollo-cache/cleanup-ran-queries-from-cache");
const mockCleanupRanQueriesFromCache = cleanupRanQueriesFromCache as jest.Mock;

jest.mock("../state/connections");
const mockIsConnected = isConnected as jest.Mock;

jest.mock("../components/scroll-into-view");
const mockScrollIntoView = scrollIntoView as jest.Mock;

const mockLoadingId = defaultLoadingDomId;
jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id={mockLoadingId} />,
}));

jest.mock("../components/DateTimeField/date-time-field.component", () => ({
  DateTimeField: MockDateTimeField,
}));

jest.mock("../components/DateField/date-field.component", () => ({
  DateField: MockDateTimeField,
}));

const mockUpdateExperiencesOnline = jest.fn();
const mockCreateOfflineEntry = jest.fn();
const mockPersistFunc = jest.fn();
const persistor = { persist: mockPersistFunc };

beforeEach(() => {
  mockScrollIntoView.mockReset();
  mockIsConnected.mockReset();
  mockCleanupRanQueriesFromCache.mockReset();
  mockUpdateExperiencesOnline.mockReset();
  mockPersistFunc.mockReset();
  mockCreateOfflineEntry.mockReset();
});

const title = "ww";

it("creates new experience entry when online", async () => {
  mockIsConnected.mockReturnValue(true);
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

  const { ui } = makeComp({
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
    makeFieldInputId("f3"),
  ) as HTMLInputElement;

  expect($decimal.value).toBe("");

  /**
   * And INTEGER field should be empty
   */
  const $integer = document.getElementById(
    makeFieldInputId("f4"),
  ) as HTMLInputElement;

  expect($integer.value).toBe("");

  /**
   * When we complete the form correctly and submit same
   */
  fillField($integer, "1");
  fillField($decimal, "2.0");
  fireEvent.click(document.getElementById(submitBtnDomId) as any);

  /**
   * Then correct values should be sent to the server
   */
  await wait(() => true);

  const {
    variables: {
      input: [
        {
          experienceId,
          addEntries: [{ dataObjects }],
        },
      ],
    },
  } = mockUpdateExperiencesOnline.mock.calls[0][0];

  expect(experienceId).toBe("1");

  const [f3, f4] = dataObjects as CreateDataObject[];

  expect(f3.definitionId).toBe("f3");
  expect(JSON.parse(f3.data).decimal).toBe("2");

  expect(f4.definitionId).toBe("f4");
  expect(JSON.parse(f4.data).integer).toBe("1");

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

it("sets field defaults, creates entry online", async () => {
  mockIsConnected.mockReturnValue(true);
  /**
   * Given we have received experiences from server
   */
  const experience = {
    dataDefinitions: [
      {
        id: "f1",
        name: "f1",
        type: DataTypes.DECIMAL,
      },
      {
        id: "f2",
        name: "f2",
        type: DataTypes.INTEGER,
      },
      {
        id: "f3",
        name: "f3",
        type: DataTypes.SINGLE_LINE_TEXT,
      },
      {
        id: "f4",
        name: "f4",
        type: DataTypes.MULTI_LINE_TEXT,
      },
    ],
  } as ExperienceFragment;

  const { ui, mockNavigate } = makeComp({
    experience,
  });

  /**
   * When component is rendered
   */
  render(ui);

  /**
   * Then error notification should not be visible
   */
  expect(document.getElementById("close-notification")).toBeNull();

  /**
   * When form is submitted without making any changes
   */
  const submitDom = document.getElementById(submitBtnDomId) as HTMLElement;

  // no dataObjects errors
  mockUpdateExperiencesOnline.mockResolvedValueOnce({
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {
              newEntries: [
                {
                  __typename: "CreateEntryErrors",
                  errors: {},
                },
              ],
            },
          },
        ],
      },
    },
  } as UpdateExperiencesOnlineMutationResult);

  submitDom.click();

  /**
   * Then error notification should be visible
   */
  let closeNotificationDom = await waitForElement(() => {
    return document.getElementById("close-notification") as HTMLElement;
  });

  /**
   * And default values should be sent to the server
   */
  const {
    variables: {
      input: [
        {
          addEntries: [{ dataObjects: inputDataObjects0 }],
        },
      ],
    },
  } = mockUpdateExperiencesOnline.mock.calls[0][0];

  let [f1, f2, f3, f4] = inputDataObjects0 as CreateDataObject[];
  expect(JSON.parse(f1.data).decimal).toBe("0");
  expect(JSON.parse(f2.data).integer).toBe("0");
  expect(JSON.parse(f3.data).single_line_text).toBe("");
  expect(JSON.parse(f4.data).multi_line_text).toBe("");

  /**
   * When error notification is closed
   */
  closeNotificationDom.click();

  /**
   * Then error notification should not be visible
   */
  expect(document.getElementById("close-notification")).toBeNull();

  /**
   * When form values are changed
   */
  const decimalInputDom = document.getElementById(
    makeFieldInputId("f1"),
  ) as HTMLInputElement;

  fillField(decimalInputDom, "0.1");

  const integerInputDom = document.getElementById(
    makeFieldInputId("f2"),
  ) as HTMLInputElement;

  fillField(integerInputDom, "1");

  const singleTextInputDom = document.getElementById(
    makeFieldInputId("f3"),
  ) as HTMLInputElement;

  fillField(singleTextInputDom, "a");

  const multiTextInputDom = document.getElementById(
    makeFieldInputId("f4"),
  ) as HTMLInputElement;

  fillField(multiTextInputDom, "a\na");

  /**
   * Then field error should not to be visible
   */
  const decimalFieldDom = decimalInputDom.closest(
    ".form__field",
  ) as HTMLElement;

  expect(decimalFieldDom.classList).not.toContain("error");
  const decimalErrorDomId = makeInputErrorDomId("f1");
  expect(document.getElementById(decimalErrorDomId)).toBeNull();

  /**
   * When form is submitted again
   */
  // 2 dataObjects errors
  mockUpdateExperiencesOnline.mockResolvedValueOnce({
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {
              newEntries: [
                {
                  __typename: "CreateEntryErrors",
                  errors: {
                    dataObjects: [
                      {
                        meta: {
                          index: 0,
                        },
                        definition: "a",
                        clientId: "",
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  } as UpdateExperiencesOnlineMutationResult);

  submitDom.click(); // 2

  /**
   * Then error notification should be visible
   */
  closeNotificationDom = await waitForElement(() => {
    return document.getElementById("close-notification") as HTMLElement;
  });

  /**
   * And updated values should be sent to the server
   */
  const {
    variables: {
      input: [
        {
          addEntries: [{ dataObjects: inputDataObjects1 }],
        },
      ],
    },
  } = mockUpdateExperiencesOnline.mock.calls[1][0];

  [f1, f2, f3, f4] = inputDataObjects1 as CreateDataObject[];
  expect(JSON.parse(f1.data).decimal).toBe("0.1");
  expect(JSON.parse(f2.data).integer).toBe("1");
  expect(JSON.parse(f3.data).single_line_text).toBe("a");
  expect(JSON.parse(f4.data).multi_line_text).toBe("a\\na");

  /**
   * And field error should be visible
   */
  expect(decimalFieldDom.classList).toContain("error");
  expect(document.getElementById(decimalErrorDomId)).not.toBeNull();
  expect(document.getElementById(makeInputErrorDomId("f2"))).toBeNull();

  /**
   * When form is submitted again
   * happy path
   */

  mockUpdateExperiencesOnline.mockResolvedValueOnce({
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {
              newEntries: [
                {
                  __typename: "CreateEntrySuccess",
                },
              ],
            },
          },
        ],
      },
    },
  } as UpdateExperiencesOnlineMutationResult);

  submitDom.click();

  /**
   * Then error notification should not be visible
   */
  expect(document.getElementById("close-notification")).toBeNull();

  /**
   * And user should be redirected
   */

  await wait(() => {
    expect(mockNavigate).toHaveBeenCalled();
  });

  expect(mockPersistFunc).toHaveBeenCalled();
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
        id: "dt",
        name: "dt",
        type: DataTypes.DATE,
      },
      {
        id: "tm",
        name: "tm",
        type: DataTypes.DATETIME,
      },
    ] as ExperienceFragment_dataDefinitions[],

    description: "lovely",

    entries: {} as ExperienceFragment_entries,
  } as ExperienceFragment;

  const { ui, mockNavigate } = makeComp({
    experience: experience,
  });

  /**
   * While we are on new entry page
   */
  render(ui);

  /**
   * When we change datetime field to 2 hours ago
   */

  fillField(
    document.getElementById(makeFieldInputId("tm")) as HTMLElement,
    toISODatetimeString(addHours(now, -2)),
  );

  /**
   * And we change date to 2 days ago
   */
  fillField(
    document.getElementById(makeFieldInputId("dt")) as HTMLElement,
    toISODatetimeString(addDays(now, -2)),
  );

  /**
   * And submit the form
   */
  (document.getElementById(submitBtnDomId) as HTMLElement).click();

  /**
   * Then the correct values should be sent to the server
   */
  await wait(() => true);

  const {
    variables: { dataObjects },
  } = mockCreateOfflineEntry.mock.calls[0][0];

  const [f1, f2] = dataObjects as CreateDataObject[];

  expect(f1.definitionId).toBe("dt");
  expect(f2.definitionId).toBe("tm");
  expect(differenceInDays(now, parseISO(JSON.parse(f1.data).date))).toBe(2);

  expect(
    differenceInHours(now, parseISO(JSON.parse(f2.data).datetime)),
  ).toBeGreaterThanOrEqual(1);

  /**
   * And user should be redirected
   */
  expect(mockNavigate).toHaveBeenCalled();
  expect(mockPersistFunc).toHaveBeenCalled();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const NewEntryP = NewEntryComponent as ComponentType<Partial<ComponentProps>>;

function makeComp(props: Partial<ComponentProps>) {
  const { Ui, ...rest } = renderWithRouter(NewEntryP);

  return {
    ui: (
      <Ui
        createOfflineEntry={mockCreateOfflineEntry}
        updateExperiencesOnline={mockUpdateExperiencesOnline}
        persistor={persistor as any}
        {...props}
      />
    ),
    ...rest,
  };
}

function MockDateTimeField(props: DateTimeProps & { id: string }) {
  const { value, id, onChange } = props;

  const comp = (
    <input
      value={toISODatetimeString(value as Date)}
      id={id}
      onChange={evt => {
        const val = evt.currentTarget.value;
        const date = new Date(val);
        onChange(name, isNaN(date.getTime()) ? "invalid" : date);
      }}
    />
  );

  return comp;
}
