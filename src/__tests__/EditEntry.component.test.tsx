/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render, wait, waitForElement } from "@testing-library/react";
import { EditEntryComponent } from "../components/EditEntry/edit-entry.component";
import {
  ComponentProps,
  ActionType,
} from "../components/EditEntry/edit-entry-utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import {
  DataTypes,
  UpdateDataObjectInput,
} from "../graphql/apollo-types/globalTypes";
import {
  fillField,
  closeMessage,
  ToInputVariables,
  ToVariables,
} from "./test_utils";
import { Props as DateTimeProps } from "../components/DateTimeField/date-time-field.utils";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { UpdateDataObjects } from "../graphql/apollo-types/UpdateDataObjects";
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";
import { toISODatetimeString } from "../components/NewEntry/new-entry.utils";
import { cleanupRanQueriesFromCache } from "../apollo-cache/cleanup-ran-queries-from-cache";
import { makeOfflineId, makeApolloCacheRef } from "../constants";
import {
  CreateOnlineEntryMutationVariables,
  CreateOnlineEntryMutation,
  CreateOnlineEntryMutation_createEntry_errors,
} from "../graphql/apollo-types/CreateOnlineEntryMutation";
import {
  CreateOnlineEntryMutationFnOptions,
  CreateEntryOnlineMutationResult,
} from "../graphql/create-entry.mutation";
import { editEntryUpdate } from "../components/EditEntry/edit-entry.injectables";
import { AppPersistor } from "../context";
import {
  ControlName,
  getDataControlDomId,
} from "../components/EditEntry/edit-entry-dom";
import { isConnected } from "../state/connections";
/* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
import { CreateOfflineEntryMutationReturned } from "../components/NewEntry/new-entry.resolvers";
import { upsertExperienceWithEntry } from "../components/NewEntry/new-entry.injectables";
import { wipeReferencesFromCache } from "../state/resolvers/delete-references-from-cache";
import { ENTRY_TYPE_NAME, DATA_OBJECT_TYPE_NAME } from "../graphql/types";
import { scrollIntoView } from "../components/scroll-into-view";

////////////////////////// MOCKS ////////////////////////////

jest.mock("../components/scroll-into-view.ts");
const mockScrollIntoView = scrollIntoView as jest.Mock;

jest.mock("../state/resolvers/delete-references-from-cache");
const mockWipeReferencesFromCache = wipeReferencesFromCache as jest.Mock;

jest.mock("../components/NewEntry/new-entry.injectables");
const mockUpsertExperienceFn = jest.fn();
const mockUpsertExperienceWithEntry = upsertExperienceWithEntry as jest.Mock;

jest.mock("../components/DateTimeField/date-time-field.component", () => ({
  DateTimeField: MockDateTimeField,
}));

jest.mock("../components/DateField/date-field.component", () => ({
  DateField: MockDateTimeField,
}));

jest.mock("../components/EditEntry/edit-entry.injectables");
const mockEditEntryUpdateFn = jest.fn();
const mockEditEntryUpdate = editEntryUpdate as jest.Mock;

jest.mock("../apollo-cache/cleanup-ran-queries-from-cache");
const mockCleanupRanQueriesFromCache = cleanupRanQueriesFromCache as jest.Mock;

jest.mock("../state/connections");
const mockIsConnected = isConnected as jest.Mock;

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
  mockUpsertExperienceWithEntry.mockReturnValue(mockUpsertExperienceFn);
  mockEditEntryUpdate.mockReturnValue(mockEditEntryUpdateFn);
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
  closeMessage(document.getElementById("edit-entry-modal"));
  expect(mockParentDispatch).toHaveBeenCalled();
});

test("submitting only data objects, apollo errors, runtime errors", async () => {
  const { ui, mockUpdateDataOnline, mockEditEntryUpdate } = makeComp({
    props: {
      hasConnection: true,
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
            name: "int",
            type: DataTypes.INTEGER,
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  render(ui);
  getDataInput("int", "5");

  // we received empty data
  mockUpdateDataOnline
    .mockResolvedValueOnce({
      data: {},
    })
    .mockResolvedValueOnce({}) // another type of empty response from server.
    .mockRejectedValueOnce(
      new ApolloError({
        graphQLErrors: [new GraphQLError("holla")],
      }),
    ) // graphQLErrors
    .mockRejectedValueOnce(
      new ApolloError({
        networkError: new Error("a"),
      }),
    ) // networkError
    .mockRejectedValueOnce(new Error("t")) //javascript exceptions apart from apollo errors
    .mockResolvedValue({
      data: {
        updateDataObjects: [
          {
            id: "int",
            dataObject: {
              id: "int",
              data: `{"int":10}`,
            },
          },
        ],
      } as UpdateDataObjects,
    });

  const $submit = getSubmit();
  expect(getSubmittingOverlay()).toBeNull();
  $submit.click();
  expect(getSubmittingOverlay()).not.toBeNull();

  let $response = await waitForElement(getSubmissionSuccessResponseDom);

  const mock = mockUpdateDataOnline.mock.calls[0][0] as ToInputVariables<
    UpdateDataObjectInput
  >;
  expect(mock.update).toBe(mockEditEntryUpdate);

  expect(mock.variables.input).toMatchObject([
    {
      id: "int",
      data: `{"integer":"5"}`,
    },
  ]);

  closeMessage($response);
  expect(getSubmissionSuccessResponseDom()).toBeNull();

  expect(getSubmittingOverlay()).toBeNull();
  $submit.click();
  expect(getSubmittingOverlay()).not.toBeNull();
  $response = await waitForElement(getOtherErrorsResponseDom);
  expect(getSubmittingOverlay()).toBeNull();

  expect(getApolloErrorsResponseDom()).toBeNull();
  $submit.click();
  $response = await waitForElement(getApolloErrorsResponseDom);
  expect($response).not.toBeNull();
  closeMessage($response);

  $submit.click();
  await waitForElement(getApolloErrorsResponseDom);

  expect(getOtherErrorsResponseDom()).toBeNull();
  $submit.click();
  await waitForElement(getOtherErrorsResponseDom);

  $submit.click();

  /**
   * Then the submit response UI should be visible
   */
  await waitForElement(getSubmissionSuccessResponseDom);

  /**
   * And global submit button should not be visible
   */
  expect(getSubmit()).toBeNull();

  /**
   * When we enter a new value for the int field
   */
  getDataInput("int", "500");

  /**
   * Then global submit button should be visible again
   */

  expect(getSubmit()).not.toBeNull();
});

test("edit online entry, submit offline - only data objects can be updated", async () => {
  /**
   * Given user wishes to edit an entry
   */

  const offlineEntry = {
    id: "en",
    experienceId: "ex",
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
  };

  /**
   * And we are offline
   */
  mockIsConnected.mockReturnValue(false);
  const { ui } = makeComp({
    props: {
      entry: offlineEntry as EntryFragment,
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
  expect(getSubmissionSuccessResponseDom()).toBeNull();

  /**
   * When form is submitted
   */
  getSubmit().click();

  /**
   * Then success UI should be visible
   */
  expect(getSubmissionSuccessResponseDom()).not.toBeNull();

  /**
   * And the data field should now show success UI
   */
  expect(getDataField("int").classList).toContain("data--success");

  /**
   * And offline ledger is updated appropriately
   */
  await wait(() => true);
  expect(mockUpsertExperienceWithEntry.mock.calls[0]).toEqual([
    "ex",
    "offline",
  ]);
  expect(mockUpsertExperienceFn).toHaveBeenCalled();
  expect(mockPersistFunc).toHaveBeenCalled();
  expect(mockScrollIntoView).toHaveBeenCalled();
});

test("edit offline entry, submit offline", async () => {
  mockUpsertExperienceWithEntry.mockReturnValue(mockUpsertExperienceFn);
  /**
   * Given user wishes to edit an entry
   */

  const entryId = makeOfflineId("en");

  const offlineEntry = {
    id: entryId,
    experienceId: "ex",
    dataObjects: [
      {
        id: "int",
        definitionId: "int",
        data: `{"integer":1}`,
      },
    ] as DataObjectFragment[],
  };

  /**
   * And we are offline
   */
  mockIsConnected.mockReturnValue(false);

  const { ui } = makeComp({
    props: {
      entry: offlineEntry as EntryFragment,
      experience: {
        id: "ex",
        dataDefinitions: [
          {
            id: "int",
            type: DataTypes.INTEGER,
            name: "int",
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
  expect(getSubmissionSuccessResponseDom()).toBeNull();

  /**
   * When form is submitted
   */
  getSubmit().click();

  /**
   * Then success UI should be visible
   */
  expect(getSubmissionSuccessResponseDom()).not.toBeNull();

  /**
   * And the data field should now show success UI
   */
  expect(getDataField("int").classList).toContain("data--success");

  /**
   * And offline ledger is updated appropriately
   */
  await wait(() => true);
  expect(mockUpsertExperienceFn).toHaveBeenCalled();
  expect(mockPersistFunc).toHaveBeenCalled();
});

test("edit offline entry, upload online, one data object updated, one not updated", async () => {
  /**
   * Given there is entry created offline with 2 data objects:
   * 1 - will be updated using the component
   * 2 - will be submitted unchanged
   */
  const offlineEntryId = makeOfflineId(1);
  const experienceId = "ex";

  const definition1Id = "int";
  const data1OnlineId = "d1on";
  const data1OfflineId = "d1of";

  const definition2Id = "dec";
  const data2OnlineId = "d2on";
  const data2OfflineId = "d2of";

  const offlineEntry = {
    id: offlineEntryId,
    clientId: offlineEntryId,
    experienceId,
    dataObjects: [
      {
        id: data1OfflineId,
        definitionId: definition1Id,
        data: `{"integer":1}`,
      },
      {
        id: data2OfflineId,
        definitionId: definition2Id,
        data: `{"decimal":1.1}`,
      },
    ] as DataObjectFragment[],
  } as EntryFragment;

  /**
   * And we are online
   */
  mockIsConnected.mockReturnValue(true);

  const { ui, mockCreateEntryOnline } = makeComp({
    props: {
      entry: offlineEntry as EntryFragment,
      hasConnection: true,
      experience: {
        id: experienceId,
        dataDefinitions: [
          {
            id: definition1Id,
            type: DataTypes.INTEGER,
            name: "int",
          },
          {
            id: definition2Id,
            type: DataTypes.DECIMAL,
            name: "dec",
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  /**
   * And form will be submitted 4 times and server will respond:
   * 1 - invalid response
   * 2 - javascript exception
   * 3 - none data entry creation error
   * 4 - data entry creation error
   * 5 - success
   */

  const createEntryResponse = {
    data: {
      createEntry: {
        entry: {
          id: "en",
          experienceId,
          clientId: offlineEntryId,
          dataObjects: [
            {
              definitionId: definition1Id,
              id: data1OnlineId,
              clientId: data1OfflineId,
              data: `{"integer":2}`,
            },
            {
              definitionId: definition2Id,
              id: data2OnlineId,
              clientId: data2OfflineId,
              data: `{"decimal":1.1}`,
            },
          ],
        },
      },
    },
  } as CreateEntryOnlineMutationResult;

  mockCreateEntryOnline
    .mockResolvedValueOnce(null) // invalid
    .mockRejectedValueOnce(new Error("")) // exception
    .mockResolvedValueOnce({
      data: {
        createEntry: {
          errors: {
            clientId: offlineEntryId,
            entry: "err",
          } as CreateOnlineEntryMutation_createEntry_errors,
        },
      } as CreateOnlineEntryMutation,
    }) // none data objects errors
    .mockResolvedValueOnce({
      data: {
        createEntry: {
          errors: {
            clientId: offlineEntryId,
            dataObjectsErrors: [
              {
                index: 0,
                clientId: data1OfflineId,
                errors: {
                  data: "is invalid",
                },
              },
            ],
          } as CreateOnlineEntryMutation_createEntry_errors,
        },
      } as CreateOnlineEntryMutation,
    }) // data objects errors
    .mockResolvedValueOnce(createEntryResponse); // success

  /**
   * When the component is launched
   */
  render(ui);

  /**
   * When we update entry data 1 to a new value
   */
  getDataInput(data1OfflineId, "2");

  /**
   * And submit button is clicked
   */
  getSubmit().click();

  /**
   * Then error UI should not be visible
   */
  expect(getOtherErrorsResponseDom()).toBeNull();

  /**
   * But after a while, error UI should be visible
   */
  await waitForElement(getOtherErrorsResponseDom);

  /**
   * When form is submitted a second time
   */
  getSubmit().click();

  /**
   * Then error UI should not be visible
   */
  expect(getOtherErrorsResponseDom()).toBeNull();

  /**
   * But after a while, error UI should be visible
   */
  await waitForElement(getOtherErrorsResponseDom);

  /**
   * When form is submitted a 3rd time
   */
  getSubmit().click();

  /**
   * Then error UI should not be visible
   */
  expect(getSubmissionSuccessResponseDom()).toBeNull();

  /**
   * But after a while, error UI should be visible
   */
  await waitForElement(getSubmissionSuccessResponseDom);

  /**
   * When form is submitted a fourth time
   */
  getSubmit().click();

  /**
   * Then general error UI should not be visible
   */
  expect(getOtherErrorsResponseDom()).toBeNull();

  /**
   * And data 1 error UI should not be visible
   */
  expect(getDataError(data1OfflineId)).toBeNull();

  /**
   * And success UI should not be visible
   */
  expect(getSubmissionSuccessResponseDom()).toBeNull();

  /**
   * But after a while, data 1 error UI should be visible
   */
  await waitForElement(() => getDataError(data1OfflineId));

  /**
   * And success UI should be visible
   */
  expect(getSubmissionSuccessResponseDom()).not.toBeNull();

  /**
   * When form is submitted the fifth time
   */
  getSubmit().click();

  /**
   * But after a while
   */
  await wait(() => true);

  /**
   * And correct data should have been uploaded to the server
   */
  const mock = mockCreateEntryOnline.mock.calls[4][0] as ToVariables<
    CreateOnlineEntryMutationVariables
  >;

  const variables: CreateOnlineEntryMutationFnOptions["variables"] = {
    input: {
      experienceId,
      clientId: offlineEntryId,
      dataObjects: [
        {
          definitionId: definition1Id,
          clientId: data1OfflineId,
          data: `{"integer":"2"}`,
        },
        {
          definitionId: definition2Id,
          clientId: data2OfflineId,
          data: `{"decimal":"1.1"}`,
        },
      ],
    },
  };

  expect(mock.variables).toEqual(variables);

  /**
   * And offline entry should be replaced with online entry in experiences
   */
  const [arg11, arg12, arg13] = mockUpsertExperienceWithEntry.mock.calls[0];

  expect([arg11, arg12]).toEqual(["ex", "online"]);
  arg13();

  /**
   * And cache should be flushed from memory
   */
  expect(mockPersistFunc).toHaveBeenCalled();

  /**
   * And offline entry data should be removed from cache.
   */

  expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual([
    makeApolloCacheRef(ENTRY_TYPE_NAME, offlineEntryId),
    makeApolloCacheRef(DATA_OBJECT_TYPE_NAME, data1OfflineId),
    makeApolloCacheRef(DATA_OBJECT_TYPE_NAME, data2OfflineId),
  ]);
});

test("online entry modified offline, sync online", async () => {
  /**
   * Given there is entry created online but modified offline with 2 data
   * objects:
   * 1 - will be updated using the component
   * 2 - will be submitted unchanged
   */
  const entryId = "en";
  const experienceId = "ex";

  const definition1Id = "int";
  const data1OnlineId = "d1on";

  const definition2Id = "dec";
  const data2OnlineId = "d2on";

  const entry = {
    id: entryId,
    modOffline: true,
    experienceId,
    dataObjects: [
      {
        id: data1OnlineId,
        definitionId: definition1Id,
        data: `{"integer":1}`,
      },
      {
        id: data2OnlineId,
        definitionId: definition2Id,
        data: `{"decimal":1.1}`,
      },
    ] as DataObjectFragment[],
  } as EntryFragment;

  /**
   * And we are online
   */

  const { ui, mockUpdateDataOnline } = makeComp({
    props: {
      entry,
      hasConnection: true,
      experience: {
        id: experienceId,
        dataDefinitions: [
          {
            id: definition1Id,
            type: DataTypes.INTEGER,
            name: "int",
          },
          {
            id: definition2Id,
            type: DataTypes.DECIMAL,
            name: "dec",
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  /**
   * And form will be submitted 4 times and server will respond:
   * 1 - invalid response
   * 2 - javascript exception
   * 3 - none data entry creation error
   * 4 - data entry creation error
   * 5 - success
   */

  const serverResponse = {
    data: {
      updateDataObjects: [
        {
          id: data1OnlineId,
          dataObject: {
            id: data1OnlineId,
            data: `{"integer":2}`,
          },
        },
        {
          id: data2OnlineId,
          dataObject: {
            id: data2OnlineId,
            data: `{"decimal":1.1}`,
          },
        },
      ],
    } as UpdateDataObjects,
  };

  mockUpdateDataOnline.mockResolvedValue(serverResponse);

  /**
   * When the component is launched
   */
  render(ui);

  /**
   * And we update entry data 1 to a new value
   */
  getDataInput(data1OnlineId, "2");

  /**
   * And form is submitted
   */
  getSubmit().click();

  /**
   * Then success response UI should not be visible
  expect(getSubmissionSuccessResponseDom()).toBeNull();

  /**
   * But after a while, success UI response should be visible
   */
  await waitForElement(getSubmissionSuccessResponseDom);

  /**
   * And correct data should have been sent to the server
   */
  expect(
    (mockUpdateDataOnline.mock.calls[0][0] as any).variables.input,
  ).toEqual([
    {
      id: data1OnlineId,
      data: `{"integer":"2"}`,
    },
    {
      id: data2OnlineId,
      data: `{"decimal":"1.1"}`,
    },
  ]);

  /**
   * And experience should be updated with updated entry in cache
   */
  expect(mockUpsertExperienceWithEntry.mock.calls[0]).toEqual(["ex", "online"]);
  expect(mockUpsertExperienceFn.mock.calls[0][1]).toEqual({
    data: {
      createEntry: {
        entry: {
          id: entryId,
          modOffline: null,
          experienceId,
          dataObjects: [
            {
              id: data1OnlineId,
              definitionId: definition1Id,
              data: `{"integer":2}`,
            },
            {
              id: data2OnlineId,
              definitionId: definition2Id,
              data: `{"decimal":1.1}`,
            },
          ] as DataObjectFragment[],
        } as EntryFragment,
      },
    },
  });

  /**
   * And cache should be flushed from memory
   */

  expect(mockPersistFunc).toHaveBeenCalled();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const EditEntryP = EditEntryComponent as ComponentType<Partial<ComponentProps>>;

function makeComp({ props = {} }: { props?: Partial<ComponentProps> } = {}) {
  const mockParentDispatch = jest.fn();
  const mockUpdateDataOnline = jest.fn();
  const mockCreateEntryOnline = jest.fn();
  const mockCreateOfflineEntry = jest.fn();
  const persistor = {
    persist: mockPersistFunc as any,
  } as AppPersistor;

  return {
    ui: (
      <EditEntryP
        createOnlineEntry={mockCreateEntryOnline}
        createOfflineEntry={mockCreateOfflineEntry}
        updateDataObjectsOnline={mockUpdateDataOnline}
        dispatch={mockParentDispatch}
        persistor={persistor}
        {...props}
      />
    ),
    mockParentDispatch,
    mockUpdateDataOnline,
    mockEditEntryUpdate: mockEditEntryUpdateFn,
    mockCreateEntryOnline,
    mockPersistFunc,
    mockCreateOfflineEntry,
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
  const $element = document.getElementById("edit-entry-modal");
  closeMessage($element);
}

function getSubmissionSuccessResponseDom() {
  return document.getElementById(
    "edit-entry-submission-response-message",
  ) as HTMLDivElement;
}

function getSubmittingOverlay() {
  return document.getElementById("submitting-overlay");
}

function getOtherErrorsResponseDom() {
  return document.getElementById(
    "edit-entry-other-errors-message",
  ) as HTMLDivElement;
}

function getApolloErrorsResponseDom() {
  return document.getElementById(
    "edit-entry-apollo-errors-message",
  ) as HTMLDivElement;
}
