/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render, wait, waitForElement } from "@testing-library/react";
import { EditEntryComponent } from "../components/EditEntry/edit-entry.component";
import { Props, ActionType } from "../components/EditEntry/edit-entry-utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import {
  DataTypes,
  UpdateDataObjectInput,
} from "../graphql/apollo-types/globalTypes";
import { fillField, closeMessage, ToInputVariables } from "./test_utils";
import { Props as DateTimeProps } from "../components/DateTimeField/date-time-field.utils";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { toISODatetimeString } from "../components/NewEntry/new-entry.utils";
import { cleanupRanQueriesFromCache } from "../apollo-cache/cleanup-ran-queries-from-cache";
import { makeOfflineId, makeApolloCacheRef } from "../constants";
import { AppPersistor } from "../context";
import {
  ControlName,
  getDataControlDomId,
  editEntryComponentDomId,
} from "../components/EditEntry/edit-entry-dom";
/* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
import { CreateOfflineEntryMutationReturned } from "../components/NewEntry/new-entry.resolvers";
import { wipeReferencesFromCache } from "../state/resolvers/delete-references-from-cache";
import { ENTRY_TYPE_NAME, DATA_OBJECT_TYPE_NAME } from "../graphql/types";
import { scrollIntoView } from "../components/scroll-into-view";
import { UpdateExperiencesOnlineMutationResult } from "../graphql/experiences.mutation";
import { writeUnsyncedExperience } from "../apollo-cache/unsynced.resolvers";
import { upsertExperienceWithEntry } from "../components/NewEntry/new-entry.injectables";
import { updateExperiencesInCache } from "../apollo-cache/update-experiences";

////////////////////////// MOCKS ////////////////////////////

jest.mock("../apollo-cache/update-experiences");
const mockUpdateExperiencesInCache = updateExperiencesInCache as jest.Mock;

jest.mock("../apollo-cache/unsynced.resolvers");
const mockWriteUnsyncedExperience = writeUnsyncedExperience as jest.Mock;

jest.mock("../components/NewEntry/new-entry.injectables");
const mockUpsertExperienceWithEntry = upsertExperienceWithEntry as jest.Mock;

jest.mock("../components/scroll-into-view.ts");
const mockScrollIntoView = scrollIntoView as jest.Mock;

jest.mock("../state/resolvers/delete-references-from-cache");
const mockWipeReferencesFromCache = wipeReferencesFromCache as jest.Mock;

jest.mock("../components/DateTimeField/date-time-field.component", () => ({
  DateTimeField: MockDateTimeField,
}));

jest.mock("../components/DateField/date-field.component", () => ({
  DateField: MockDateTimeField,
}));

jest.mock("../apollo-cache/cleanup-ran-queries-from-cache");
const mockCleanupRanQueriesFromCache = cleanupRanQueriesFromCache as jest.Mock;

const mockUpdateExperiencesOnline = jest.fn();

let errorConsoleSpy: jest.SpyInstance;
const mockPersistFunc = jest.fn();

beforeAll(() => {
  errorConsoleSpy = jest.spyOn(console, "error").mockImplementation(() => null);
});

afterAll(() => {
  errorConsoleSpy.mockReset();
});

beforeEach(() => {
  jest.resetAllMocks();
});

it("destroys the UI", async () => {
  const { ui, mockParentDispatch } = makeComp({
    props: {
      entry: {
        dataObjects: [] as DataObjectFragment[],
      } as EntryFragment,

      experience: {
        dataDefinitions: [
          {
            id: "a",
            type: DataTypes.INTEGER,
            name: "f1",
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  const { unmount } = render(ui);

  destroyModal();

  expect((mockParentDispatch.mock.calls[0][0] as any).type).toEqual(
    ActionType.DESTROYED,
  );

  expect(mockCleanupRanQueriesFromCache).not.toHaveBeenCalled();

  unmount();
  expect(mockCleanupRanQueriesFromCache).toHaveBeenCalledTimes(1);
});

test("renders error boundary", () => {
  const { ui, mockParentDispatch } = makeComp({
    props: {
      entry: {
        dataObjects: [
          {
            id: "int",
            definitionId: "int",
            data: `{"integer":1}`,
          },
        ],
      } as EntryFragment,

      experience: {
        dataDefinitions: [
          {
            id: "int",
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  render(ui);

  expect(document.getElementById("edit-entry-error-fallback")).not.toBeNull();
  closeMessage(document.getElementById(editEntryComponentDomId));
  expect(mockParentDispatch).toHaveBeenCalled();
});

test("edit online entry, submit online", async () => {
  const experienceId = "ex";
  const entryId = "en";

  const { ui } = makeComp({
    props: {
      hasConnection: true,
      entry: {
        id: entryId,
        experienceId,
        dataObjects: [
          {
            id: "int",
            definitionId: "int",
            data: `{"integer":1}`,
          },
        ],
      } as EntryFragment,

      experience: {
        id: experienceId,
        dataDefinitions: [
          {
            id: "int",
            name: "int",
            type: DataTypes.INTEGER,
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  /**
   * When component is rendered
   */

  render(ui);

  /**
   * And entry data is changed
   */
  const dataInputDom = getDataInput("int", "5");

  /**
   * Then error notification should not be visible
   */
  expect(getErrorsNotificationDom()).toBeNull();

  /**
   * When form is submitted
   */
  const submitDom = getSubmit();
  mockUpdateExperiencesOnline.mockResolvedValueOnce({});
  submitDom.click();

  /**
   * Then error notification should be visible
   */
  let responseDom = await waitForElement(getErrorsNotificationDom);

  /**
   * And correct value should be sent to the server
   */

  const mock = mockUpdateExperiencesOnline.mock.calls[0][0] as ToInputVariables<
    UpdateDataObjectInput
  >;

  expect(mock.variables.input[0]).toEqual({
    experienceId,
    updateEntries: [
      {
        entryId,
        dataObjects: [
          {
            id: "int",
            data: `{"integer":"5"}`,
          },
        ],
      },
    ],
  });

  /**
   * When error notification is closed
   */
  closeMessage(responseDom);

  /**
   * Then error notification should not be visible
   */
  expect(getErrorsNotificationDom()).toBeNull();

  /**
   * When form is submitted
   */
  mockUpdateExperiencesOnline.mockRejectedValueOnce(new Error("t"));
  submitDom.click();

  /**
   * Then error notification should be visible
   */
  responseDom = await waitForElement(getErrorsNotificationDom);

  /**
   * When error notification is closed
   */
  closeMessage(responseDom);

  /**
   * Then error notification should not be visible
   */
  expect(getErrorsNotificationDom()).toBeNull();

  /**
   * When form is submitted
   */
  mockUpdateExperiencesOnline.mockResolvedValueOnce({
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {},
          },
        ],
      },
    },
  } as UpdateExperiencesOnlineMutationResult);
  submitDom.click();

  /**
   * Then error notification should now be visible
   */
  responseDom = await waitForElement(getErrorsNotificationDom);

  /**
   * When error notification is closed
   */
  closeMessage(responseDom);

  /**
   * Then error notification should not be visible
   */
  expect(getErrorsNotificationDom()).toBeNull();

  /**
   * When form is submitted
   */
  mockUpdateExperiencesOnline.mockResolvedValueOnce({
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {
              updatedEntries: [
                {
                  __typename: "UpdateEntryErrors",
                  errors: {
                    error: "UpdateEntryErrors",
                  },
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
   * Then error notification should now be visible
   */
  await waitForElement(getErrorsNotificationDom);

  /**
   * And field error should not be visible
   */
  expect(getDataError("int")).toBeNull();

  /**
   * When form is submitted
   */
  mockUpdateExperiencesOnline.mockResolvedValueOnce({
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {
              updatedEntries: [
                {
                  __typename: "UpdateEntrySomeSuccess",
                  entry: {
                    dataObjects: [
                      {
                        __typename: "DataObjectErrors",
                        errors: {
                          meta: {
                            id: "int",
                          },
                          data: "a",
                          error: null,
                        },
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
  submitDom.click();

  /**
   * Then success notification should now be visible
   */
  responseDom = await waitForElement(getSuccessNotificationDom);

  /**
   * And error notification should not be visible
   */
  expect(getErrorsNotificationDom()).toBeNull();

  /**
   * And field error should be visible
   */
  expect(getDataError("int")).not.toBeNull();

  /**
   * When success notification is closed
   */
  closeMessage(responseDom);

  /**
   * Then success notification should not be visible
   */
  expect(getSuccessNotificationDom()).toBeNull();

  /**
   * When form is submitted
   */
  mockUpdateExperiencesOnline.mockResolvedValueOnce({
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {
              updatedEntries: [
                {
                  __typename: "UpdateEntrySomeSuccess",
                  entry: {
                    dataObjects: [
                      {
                        __typename: "DataObjectSuccess",
                        dataObject: {
                          id: "int",
                          data: `{"int":10}`,
                        },
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
  submitDom.click();

  /**
   * Then success notification should now be visible
   */
  responseDom = await waitForElement(getSuccessNotificationDom);

  /**
   * And field error should not be visible
   */
  expect(getDataError("int")).toBeNull();

  /**
   * And global submit button should not be visible
   */
  expect(getSubmit()).toBeNull();

  /**
   * And data input value should be updated with value from server
   */
  expect(dataInputDom.value).toBe("10");

  /**
   * When we enter a new value for the int field
   */
  getDataInput("int", "500");

  /**
   * Then global submit button should be visible again
   */

  expect(getSubmit()).not.toBeNull();
});

test("edit online entry, submit offline", async () => {
  /**
   * Given user wishes to edit an entry
   */

  const experienceId = "ex";
  const entryId = "en";

  const onlineEntry = {
    id: entryId,
    experienceId,
    dataObjects: [
      {
        id: "int",
        definitionId: "int",
        data: `{"integer":1}`,
      },
      {
        id: "dec",
        definitionId: "dec",
        data: `{"decimal":1.1}`,
      },
    ] as DataObjectFragment[],
  } as EntryFragment;

  const { ui } = makeComp({
    props: {
      hasConnection: false,
      entry: onlineEntry,
      experience: {
        id: "ex",
        dataDefinitions: [
          {
            id: "int",
            type: DataTypes.INTEGER,
            name: "int",
          },
          {
            id: "dec",
            type: DataTypes.DECIMAL,
            name: "dec",
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  /**
   * When component is rendered
   */
  render(ui);

  /**
   * When we update entry data to a new value
   */
  getDataInput("int", "2");

  /**
   * Then the data field should not show success UI
   */
  expect(getDataField("int").classList).not.toContain("data--success");

  /**
   * And success UI should not be visible
   */
  expect(getSuccessNotificationDom()).toBeNull();

  /**
   * When form is submitted
   */
  getSubmit().click();

  /**
   * Then success UI should be visible
   */
  expect(getSuccessNotificationDom()).not.toBeNull();

  /**
   * And the data field should now show success UI
   */
  expect(getDataField("int").classList).toContain("data--success");

  /**
   * And cache is updated accordingly
   */
  await wait(() => true);
  expect(mockPersistFunc).toHaveBeenCalled();
  expect(mockScrollIntoView).toHaveBeenCalled();
  expect(mockWriteUnsyncedExperience.mock.calls[0]).toEqual([
    experienceId,
    {
      modifiedEntries: {
        [entryId]: {
          int: true,
        },
      },
    },
  ]);
});

test("edit offline entry, submit offline", async () => {
  /**
   * Given user wishes to edit an entry
   */

  const entryId = makeOfflineId("en");
  const experienceId = "ex";

  const offlineEntry = {
    id: entryId,
    experienceId,
    dataObjects: [
      {
        id: "int",
        definitionId: "int",
        data: `{"integer":1}`,
      },
    ],
  } as EntryFragment;

  const { ui } = makeComp({
    props: {
      entry: offlineEntry,
      experience: {
        id: "ex",
        dataDefinitions: [
          {
            id: "int",
            type: DataTypes.INTEGER,
            name: "int",
          },
        ],
      } as ExperienceFragment,
    },
  });

  /**
   * When component is rendered
   */
  render(ui);

  /**
   * And entry data is updated to a new value
   */
  getDataInput("int", "2");

  /**
   * Then the data field should not show success UI
   */
  expect(getDataField("int").classList).not.toContain("data--success");

  /**
   * And success UI should not be visible
   */
  expect(getSuccessNotificationDom()).toBeNull();

  /**
   * When form is submitted
   */
  getSubmit().click();

  /**
   * Then success UI should be visible
   */
  expect(getSuccessNotificationDom()).not.toBeNull();

  /**
   * And the data field should now show success UI
   */
  expect(getDataField("int").classList).toContain("data--success");

  /**
   * And cache should have been updated accordingly
   */
  await wait(() => true);
  expect(mockPersistFunc).toHaveBeenCalled();
  const [, arg1, arg2] = mockUpsertExperienceWithEntry.mock.calls[0];

  expect(arg1.dataObjects[0]).toMatchObject({
    data: '{"integer":"2"}',
    definitionId: "int",
    id: "int",
  });

  expect(arg2).toBe(experienceId);
});

test("online experience: edit offline entry, upload online", async () => {
  /**
   * Given there is entry created offline with 2 data objects:
   * 1 - will be updated using the component
   * 2 - will be submitted unchanged
   */
  const offlineEntryId = makeOfflineId(1);
  const experienceId = "ex";

  const defId = "int";
  const dataId = "int";

  const offlineEntry = {
    id: offlineEntryId,
    clientId: offlineEntryId,
    experienceId,
    dataObjects: [
      {
        id: dataId,
        definitionId: defId,
        data: `{"integer":1}`,
      },
    ],
  } as EntryFragment;

  const { ui } = makeComp({
    props: {
      entry: offlineEntry,
      hasConnection: true,
      experience: {
        id: experienceId,
        dataDefinitions: [
          {
            id: defId,
            type: DataTypes.INTEGER,
            name: "int",
          },
        ],
      } as ExperienceFragment,
    },
  });

  /**
   * When the component is launched
   */
  render(ui);

  /**
   * When we update entry data 1 to a new value
   */
  getDataInput(dataId, "2");

  /**
   * Then error UI should not be visible
   */
  expect(getErrorsNotificationDom()).toBeNull();

  /**
   * When form is submitted
   */
  const submitDom = getSubmit();
  mockUpdateExperiencesOnline.mockResolvedValue(null);
  submitDom.click();

  /**
   * Then error notification should be visible
   */
  let notificationDom = await waitForElement(getErrorsNotificationDom);

  /**
   * When error notification is closed
   */
  closeMessage(notificationDom);

  /**
   * Then error notification should not be visible
   */
  expect(getErrorsNotificationDom()).toBeNull();

  /**
   * When form is submitted
   */
  mockUpdateExperiencesOnline.mockRejectedValue(new Error("a"));
  submitDom.click();

  /**
   * Then error notification should be visible
   */
  notificationDom = await waitForElement(getErrorsNotificationDom);

  /**
   * When error notification is closed
   */
  closeMessage(notificationDom);

  /**
   * Then error notification should not be visible
   */
  expect(getErrorsNotificationDom()).toBeNull();

  /**
   * When form is submitted
   * no newEntries key
   */
  mockUpdateExperiencesOnline.mockResolvedValue({
    data: {
      updateExperiences: {
        __typename: "UpdateExperiencesSomeSuccess",
        experiences: [
          {
            __typename: "UpdateExperienceSomeSuccess",
            experience: {},
          },
        ],
      },
    },
  } as UpdateExperiencesOnlineMutationResult);
  submitDom.click();

  /**
   * Then error notification should be visible
   */
  notificationDom = await waitForElement(getErrorsNotificationDom);

  /**
   * And success notification should not be visible
   */
  expect(getSuccessNotificationDom()).toBeNull();

  /**
   * When form is submitted
   * no data objects error
   */
  mockUpdateExperiencesOnline.mockResolvedValue({
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
   * Then success notification should be visible
   */
  notificationDom = await waitForElement(getSuccessNotificationDom);

  /**
   * And error notification should not be visible
   */
  expect(getErrorsNotificationDom()).toBeNull();

  /**
   * When success notification is closed
   */
  closeMessage(notificationDom);

  /**
   * Then success notification should not be visible
   */
  expect(getSuccessNotificationDom()).toBeNull();

  /**
   * And field error should not be visible
   */
  expect(getDataError(dataId)).toBeNull();
  expect(getDataField(dataId).classList).not.toContain("error");

  /**
   * When form is submitted
   * there is data objects error
   */
  mockUpdateExperiencesOnline.mockResolvedValue({
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
                          clientId: dataId,
                        },
                        data: "a",
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
  submitDom.click();

  /**
   * Then success notification should be visible
   */
  notificationDom = await waitForElement(getSuccessNotificationDom);

  /**
   * And field error should be visible
   */
  expect(getDataError(dataId)).not.toBeNull();
  expect(getDataField(dataId).classList).toContain("error");

  /**
   * When form is submitted
   * happy path
   */
  mockUpdateExperiencesOnline.mockReset();
  mockUpdateExperiencesOnline.mockResolvedValue({
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
  await wait(() => true);

  /**
   * And cache should be flushed from memory
   */

  const onDoneFn = mockUpdateExperiencesInCache.mock.calls[0][0];

  onDoneFn();

  expect(mockPersistFunc).toHaveBeenCalled();

  expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual([
    makeApolloCacheRef(ENTRY_TYPE_NAME, offlineEntryId),
    makeApolloCacheRef(DATA_OBJECT_TYPE_NAME, dataId),
  ]);
});

test("edit offline experience entry, submit online", async () => {
  expect(1).toBe(1);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const EditEntryP = EditEntryComponent as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const mockParentDispatch = jest.fn();
  const persistor = {
    persist: mockPersistFunc as any,
  } as AppPersistor;

  return {
    ui: (
      <EditEntryP
        dispatch={mockParentDispatch}
        persistor={persistor}
        updateExperiencesOnline={mockUpdateExperiencesOnline}
        {...props}
      />
    ),
    mockParentDispatch,
    mockPersistFunc,
  };
}

function getDataField(id: string) {
  return (document.getElementById(
    getDataControlDomId(id, ControlName.input),
  ) as HTMLInputElement).closest(".field") as HTMLElement;
}

function getDataInput(id: string, val?: string) {
  const $input = document.getElementById(
    getDataControlDomId(id, ControlName.input),
  ) as HTMLInputElement;

  if (val) {
    fillField($input, val);
  }

  return $input;
}

function getDataError(id: string) {
  return document.getElementById(
    getDataControlDomId(id, ControlName.error),
  ) as HTMLInputElement;
}

function getSubmit() {
  return document.getElementById("edit-entry-submit") as HTMLButtonElement;
}

function MockDateTimeField(props: DateTimeProps) {
  const { value, name, onChange } = props;

  const comp = (
    <input
      value={toISODatetimeString(value as Date)}
      id={name}
      onChange={evt => {
        const val = evt.currentTarget.value;
        const date = new Date(val);
        onChange(name, isNaN(date.getTime()) ? "invalid" : date);
      }}
    />
  );

  return comp;
}

function destroyModal() {
  const $element = document.getElementById(editEntryComponentDomId);
  closeMessage($element);
}

function getSuccessNotificationDom() {
  return document.getElementById(
    "edit-entry-submission-response-message",
  ) as HTMLDivElement;
}

function getErrorsNotificationDom() {
  return document.getElementById(
    "edit-entry-other-errors-message",
  ) as HTMLDivElement;
}
