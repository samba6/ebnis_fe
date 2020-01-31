/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render, waitForElement, wait } from "@testing-library/react";
import {
  ExperienceComponent,
  getTitle,
} from "../components/Experience/experience.component";
import {
  Props,
  StateValue,
  reducer,
  initState,
  ActionType,
} from "../components/Experience/experience.utils";
import { renderWithRouter } from "./test_utils";
import {
  ExperienceFragment_entries_edges,
  ExperienceFragment_dataDefinitions,
  ExperienceFragment,
} from "../graphql/apollo-types/ExperienceFragment";
import { ActionType as EditExperienceActionType } from "../components/EditExperience/edit-experience.utils";
import {
  getUnsyncedExperience,
  removeUnsyncedExperience,
} from "../apollo-cache/unsynced.resolvers";
import {
  syncButtonId,
  errorsNotificationId,
  closeSubmitNotificationBtnSelector,
  successNotificationId,
  newEntryTriggerId,
} from "../components/Experience/experience.dom";
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";
import {
  UpdateExperiencesOnlineMutationResult,
  CreateExperiencesMutationResult,
} from "../graphql/update-experience.mutation";
import { makeOfflineId } from "../constants";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../apollo-cache/update-get-experiences-mini-query";
import { wipeReferencesFromCache } from "../state/resolvers/delete-references-from-cache";

jest.mock("../state/resolvers/delete-references-from-cache");
const mockWipeReferencesFromCache = wipeReferencesFromCache as jest.Mock;

jest.mock("../apollo-cache/update-get-experiences-mini-query");
const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;

jest.mock("../components/Experience/loadables", () => ({
  EditExperience: () => <div id="js-editor" />,

  EditEntry: () => <div id="entry-edit-modal" />,
}));

jest.mock("../components/Entry/entry.component", () => ({
  Entry: () => <div id="default-entry" />,
}));

jest.mock("../apollo-cache/unsynced.resolvers");
const mockGetUnsyncedExperience = getUnsyncedExperience as jest.Mock;
const mockRemoveUnsyncedExperience = removeUnsyncedExperience as jest.Mock;

const mockUpdateExperiencesOnline = jest.fn();
const mockCreateEntries = jest.fn();
const mockCreateExperiences = jest.fn();
const mockPersistFunc = jest.fn();
const persistor = { persist: mockPersistFunc };

beforeEach(() => {
  jest.useFakeTimers();
  mockUpdateExperiencesOnline.mockReset();
  mockCreateEntries.mockReset();
  mockCreateExperiences.mockReset();
  mockGetUnsyncedExperience.mockReset();
  mockRemoveUnsyncedExperience.mockReset();
  mockWipeReferencesFromCache.mockReset();
  mockReplaceExperiencesInGetExperiencesMiniQuery.mockReset();
  mockPersistFunc.mockReset();
});

it("renders ui to show empty entries", () => {
  const mockOnDelete = jest.fn();

  const { ui } = makeComp({
    experience: {
      id: "1",
      entries: {
        edges: [],
      },
    } as any,

    menuOptions: {
      onDelete: mockOnDelete,
    },
  });

  /**
   * When we use the component
   */
  render(ui);

  /**
   * And we should see texts informing us that there are no entries
   */
  expect(document.getElementById("experience-no-entries")).not.toBeNull();
});

it("renders entries when `entries prop provided`", () => {
  /**
   * Given that experience and associated entries exist in the system
   */
  const edges = [
    {
      node: {
        id: "a",
      },
    },
  ] as ExperienceFragment_entries_edges[];

  const fieldDefs = [{}] as ExperienceFragment_dataDefinitions[];

  const { ui } = makeComp({
    experience: {
      id: "1",
      fieldDefs,

      entries: { edges },
    } as any,
  });

  /**
   * When we start using the component
   */
  render(ui);

  /**
   * Then we should not see text informing us there are not entries (of course
   * we have several)
   */
  expect(document.getElementById("experience-no-entries")).toBeNull();
  expect(document.getElementById("default-entry")).not.toBeNull();
});

it("renders entries when `entriesJSX prop provided` and sets entry id", () => {
  /**
   * Given that experience and associated entries exist in the system
   */

  const { ui } = makeComp({
    experience: {} as any,
    entriesJSX: <div id="custom-entry" />,
  });

  /**
   * When we start using the component
   */
  render(ui);

  expect(document.getElementById(`custom-entry`)).not.toBeNull();
});

it("toggles experience editor", () => {
  const { ui } = makeComp({
    experience: {
      id: "a",
      entries: {
        edges: [],
      },
    } as any,
    menuOptions: { onEdit: {} } as any,
  });

  render(ui);

  expect(document.getElementById("js-editor")).toBeNull();

  (document.getElementById("experience-a-edit-menu") as HTMLDivElement).click();

  expect(document.getElementById("js-editor")).not.toBeNull();
});

test("reducer", () => {
  const prevState = initState({} as any);

  expect(
    reducer(prevState, { type: EditExperienceActionType.ABORTED }).states
      .editingExperience.value,
  ).toEqual(StateValue.idle);

  expect(
    reducer(prevState, { type: ActionType.EDIT_EXPERIENCE }).states
      .editingExperience.value,
  ).toEqual(StateValue.editing);

  expect(
    reducer(prevState, { type: EditExperienceActionType.COMPLETED }).states
      .editingExperience.value,
  ).toEqual(StateValue.idle);

  expect(prevState.context.offlineExperienceNewlySynced).toBeUndefined();

  expect(
    reducer(prevState, {
      type: ActionType.SET_OFFLINE_EXPERIENCE_NEWLY_SYNCED,
      data: true,
    }).context.offlineExperienceNewlySynced,
  ).toBe(true);
});

test("getTitle", () => {
  expect(getTitle({ title: "a" })).toEqual("a");
  expect(getTitle()).toEqual("Experience");
});

test("sync online experience", async () => {
  const { ui } = makeComp({
    experience: {
      title: "t1",
      id: "a",
      entries: {
        edges: [] as ExperienceFragment_entries_edges[],
      },
      hasUnsaved: true,
      dataDefinitions: [
        {
          id: "1",
        },
        {
          id: "2",
          name: "2a",
        },
      ],
    } as ExperienceFragment,
    hasConnection: true,
  });

  /**
   * SUBMISSIONS:
   * 1. unsynced = null
   * 2. unsynced.ownFields.title, serverResponse invalid
   * 3. unsynced.definitions only, javascript exception
   * 4. unsynced.ownFields.title, networkError
   * 5. unsynced.ownFields.title, graphQLErrors
   * 6. unsynced.ownFields.title, UpdateExperiencesAllFail
   * 7. unsynced.ownFields.title, UpdateExperiencesSomeSuccess.UpdateExperienceFullErrors
   * 8. unsynced.ownFields.title, UpdateExperiencesSomeSuccess.UpdateExperienceSomeSuccess - all error
   * 9. unsynced.ownFields.title, UpdateExperiencesSomeSuccess.UpdateExperienceSomeSuccess - all success
   */

  mockUpdateExperiencesOnline
    .mockResolvedValueOnce({}) // 2
    .mockRejectedValueOnce(new Error("a")) // 3
    .mockRejectedValueOnce(
      new ApolloError({
        networkError: new Error("n"),
      }),
    ) // 4
    .mockRejectedValueOnce(
      new ApolloError({
        graphQLErrors: [new GraphQLError("a")],
      }),
    ) // 5
    .mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesAllFail",
          error: "a",
        },
      },
    } as UpdateExperiencesOnlineMutationResult) // 6
    .mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceFullErrors",
              errors: {
                error: "a",
              },
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult) // 7
    .mockResolvedValueOnce({
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
    } as UpdateExperiencesOnlineMutationResult) // 8
    .mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceSomeSuccess",
              experience: {
                ownFields: {},
                updatedDefinitions: [{}],
              },
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult); // 9

  mockGetUnsyncedExperience
    .mockReturnValueOnce(null) // 1
    .mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    }) // 2
    .mockReturnValueOnce({
      definitions: {
        "2": {
          name: true,
        },
      },
    }) // 3
    .mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    }) // 4
    .mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    }) // 5
    .mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    }) // 6
    .mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    }) // 7
    .mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    }) // 8
    .mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    }); // 9

  /**
   * When component is rendered
   */
  render(ui);

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  const syncBtn = document.getElementById(syncButtonId) as HTMLButtonElement;
  syncBtn.click(); // 1
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); //2
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * Correct data should be sent to server
   */
  let mockUpdateExperiencesOnlineCalls = mockUpdateExperiencesOnline.mock.calls;

  let mockUpdateExperiencesOnlineArgs =
    mockUpdateExperiencesOnlineCalls[
      mockUpdateExperiencesOnlineCalls.length - 1
    ][0];

  expect(mockUpdateExperiencesOnlineArgs.variables.input).toEqual([
    {
      experienceId: "a",
      ownFields: {
        title: "t1",
      },
    },
  ]);

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 3
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * Correct data should be sent to server
   */
  mockUpdateExperiencesOnlineCalls = mockUpdateExperiencesOnline.mock.calls;

  mockUpdateExperiencesOnlineArgs =
    mockUpdateExperiencesOnlineCalls[
      mockUpdateExperiencesOnlineCalls.length - 1
    ][0];

  expect(mockUpdateExperiencesOnlineArgs.variables.input).toEqual([
    {
      experienceId: "a",
      updateDefinitions: [
        {
          id: "2",
          name: "2a",
        },
      ],
    },
  ]);

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 4
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 5
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 6
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 7
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 8
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * And success notification should not be visible
   */
  expect(document.getElementById(successNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 8
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(successNotificationId);
  });

  /**
   * And error notification should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();
});

test("sync offline experience, navigate to new entry", async () => {
  const experienceId = makeOfflineId(1);

  const { mockNavigate, ui } = makeComp({
    experience: {
      id: experienceId,
      title: "t1",
      entries: {
        edges: [
          {
            node: {
              id: "e1",
              clientId: "e1",
              dataObjects: [
                {
                  id: "1",
                },
              ],
            },
          },
        ] as ExperienceFragment_entries_edges[],
      },
      dataDefinitions: [
        {
          id: "1",
        },
      ],
    } as ExperienceFragment,
    hasConnection: true,
  });

  /**
   * SUBMISSIONS
   * 1. javascript exception
   * 2. networkError
   * 3. GraphQLError
   * 4. Invalid response
   * 5. CreateExperienceErrorss
   * 6. ExperienceSuccess.entriesErrors
   * 7. ExperienceSuccess no entriesErrors
   */
  mockCreateExperiences
    .mockRejectedValueOnce(new Error("a")) // 1
    .mockRejectedValueOnce(
      new ApolloError({
        networkError: new Error("a"),
      }),
    ) // 2
    .mockRejectedValueOnce(
      new ApolloError({
        graphQLErrors: [new GraphQLError("a")],
      }),
    ) // 3
    .mockResolvedValueOnce({
      data: {
        createExperiences: [],
      },
    } as CreateExperiencesMutationResult) // 4
    .mockResolvedValueOnce({
      data: {
        createExperiences: [
          {
            __typename: "CreateExperienceErrorss",
            errors: {},
          },
        ],
      },
    } as CreateExperiencesMutationResult) // 5
    .mockResolvedValueOnce({
      data: {
        createExperiences: [
          {
            __typename: "ExperienceSuccess",
            entriesErrors: [{}],
          },
        ],
      },
    } as CreateExperiencesMutationResult) // 6
    .mockResolvedValueOnce({
      data: {
        createExperiences: [
          {
            __typename: "ExperienceSuccess",
            experience: {
              id: "a",
            },
          },
        ],
      },
    } as CreateExperiencesMutationResult); // 7

  /**
   * When component is rendered
   */
  render(ui);

  /**
   * Then page navigation function should not be invoked
   */
  expect(mockNavigate).not.toHaveBeenCalled();

  /**
   * When new entry button is clicked
   */
  (document.getElementById(newEntryTriggerId) as HTMLElement).click();

  /**
   * Then page navigation function should be invoked
   */
  expect(mockNavigate).toHaveBeenCalled();
  (mockNavigate as any).mockReset();

  /**
   * And error notification should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  const syncBtn = document.getElementById(syncButtonId) as HTMLElement;
  syncBtn.click(); // 1
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  syncBtn.click(); // 2
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 3
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 4
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 5
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * When error UI is closed
   */
  (document.getElementsByClassName(
    closeSubmitNotificationBtnSelector,
  )[0] as HTMLElement).click();

  /**
   * Then error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 6
  await wait(() => true);

  /**
   * Then error UI should be visible
   */
  await waitForElement(() => {
    return document.getElementById(errorsNotificationId);
  });

  /**
   * And cache cleanup functions should not be invoked
   */
  expect(mockRemoveUnsyncedExperience).not.toHaveBeenCalled();

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery,
  ).not.toHaveBeenCalled();

  expect(mockWipeReferencesFromCache).not.toHaveBeenCalled();
  expect(mockPersistFunc).not.toHaveBeenCalled();

  /**
   * And page should not navigate away
   */
  expect(mockNavigate).not.toHaveBeenCalled();

  /**
   * When sync button is clicked
   */
  syncBtn.click(); // 6
  await wait(() => true);
  jest.runAllTimers();

  /**
   * And cache cleanup functions should be invoked
   */
  expect(mockPersistFunc).toHaveBeenCalled();

  expect(mockRemoveUnsyncedExperience.mock.calls[0][0]).toBe(experienceId);

  expect(
    mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
  ).toEqual({
    [experienceId]: null,
  });

  expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual([
    experienceId,
    "e1",
  ]);

  /**
   * And error UI should not be visible
   */
  expect(document.getElementById(errorsNotificationId)).toBeNull();

  /**
   * And page should navigate away
   */
  expect(mockNavigate).toHaveBeenCalled();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const ExperienceP = ExperienceComponent as P;

type P = ComponentType<Partial<Props>>;

function makeComp(props: Partial<Props> = {}) {
  const { Ui, mockNavigate } = renderWithRouter(ExperienceP, {});

  return {
    ui: (
      <Ui
        {...props}
        updateExperiencesOnline={mockUpdateExperiencesOnline}
        createEntries={mockCreateEntries}
        createExperiences={mockCreateExperiences}
        persistor={persistor as any}
      />
    ),
    mockNavigate,
  };
}
