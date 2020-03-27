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
  EffectState,
  DefSyncOfflineEditedExperienceEffect,
  EffectArgs,
  effectFunctions,
} from "../components/Experience/experience.utils";
import { renderWithRouter } from "./test_utils";
import {
  ExperienceFragment_entries_edges,
  ExperienceFragment_dataDefinitions,
  ExperienceFragment,
} from "../graphql/apollo-types/ExperienceFragment";
import {
  getUnsyncedExperience,
  removeUnsyncedExperience,
} from "../apollo-cache/unsynced.resolvers";
import {
  syncButtonId,
  errorsNotificationId,
  closeSubmitNotificationBtnSelector,
  offlineExperienceSyncedNotificationSuccessSelector,
  newEntryTriggerSelector,
  onlineExperienceSyncedNotificationSuccessDom,
  onOnlineExperienceSyncedNotificationErrorDom,
  cancelDeleteExperienceDomId,
  makeDeleteMenuDomId,
  okDeleteExperienceDomId,
  experienceNoEntriesDomId,
} from "../components/Experience/experience.dom";
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";
import {
  UpdateExperiencesOnlineMutationResult,
  CreateExperiencesMutationResult,
} from "../graphql/experiences.mutation";
import { makeOfflineId } from "../constants";
import { saveOnSyncOfflineExperienceComponentSuccess } from "../apollo-cache/on-sync-offline-experience-component-success";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import { deleteExperiencesFromCache } from "../apollo-cache/delete-experiences-from-cache";
import {
  writeDeletedExperienceTitle,
  confirmShouldDeleteExperience,
} from "../apollo-cache/should-delete-experience";
import { DeleteExperiencesMutationResult } from "../graphql/experiences.mutation";
import { removeQueriesAndMutationsFromCache } from "../state/resolvers/delete-references-from-cache";

jest.mock("../apollo-cache/on-sync-offline-experience-component-success");
const mockSaveOnSyncOfflineExperienceComponentSuccess = saveOnSyncOfflineExperienceComponentSuccess as jest.Mock;

jest.mock("../components/Experience/experience.loadables", () => ({
  EditExperience: () => <div id="js-editor" />,
  EditEntry: () => <div id="entry-edit-modal" />,
}));

jest.mock("../components/Entry/entry.component", () => () => (
  <div id="default-entry" />
));

jest.mock("../apollo-cache/unsynced.resolvers");
const mockGetUnsyncedExperience = getUnsyncedExperience as jest.Mock;
const mockRemoveUnsyncedExperience = removeUnsyncedExperience as jest.Mock;

jest.mock("../apollo-cache/delete-experiences-from-cache");
const mockDeleteExperiencesFromCache = deleteExperiencesFromCache as jest.Mock;

jest.mock("../apollo-cache/should-delete-experience");
const mockWriteDeletedExperienceTitle = writeDeletedExperienceTitle as jest.Mock;

jest.mock("../state/resolvers/delete-references-from-cache");
const mockRemoveQueriesAndMutationsFromCache = removeQueriesAndMutationsFromCache as jest.Mock;

jest.mock("../apollo-cache/should-delete-experience");
const mockConfirmShouldDeleteExperience = confirmShouldDeleteExperience as jest.Mock;

const mockUpdateExperiencesOnline = jest.fn();
const mockCreateEntries = jest.fn();
const mockCreateExperiences = jest.fn();
const mockPersistFunc = jest.fn();
const persistor = { persist: mockPersistFunc };
const mockDeleteExperiences = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  mockUpdateExperiencesOnline.mockReset();
  mockCreateEntries.mockReset();
  mockCreateExperiences.mockReset();
  mockGetUnsyncedExperience.mockReset();
  mockRemoveUnsyncedExperience.mockReset();
  mockPersistFunc.mockReset();
  mockDeleteExperiences.mockReset();
  mockDeleteExperiencesFromCache.mockReset();
  mockWriteDeletedExperienceTitle.mockReset();
  mockRemoveQueriesAndMutationsFromCache.mockReset();
  mockConfirmShouldDeleteExperience.mockReset();
});

describe("component", () => {
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
    expect(document.getElementById(experienceNoEntriesDomId)).not.toBeNull();
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

    (document.getElementById(
      "experience-a-edit-menu",
    ) as HTMLDivElement).click();

    expect(document.getElementById("js-editor")).not.toBeNull();
  });

  test("getTitle", () => {
    expect(getTitle({ title: "a" })).toEqual("a");
    expect(getTitle()).toEqual("Experience");
  });

  test("sync online experience", async () => {
    const entryOnlineId = "exon";
    const entryOfflineId = makeOfflineId("e");

    const { ui } = makeComp({
      experience: {
        title: "t1",
        id: "a",
        entries: {
          edges: [
            {
              node: {
                id: entryOnlineId,
              },
            },
            {
              node: {
                id: entryOfflineId,
                dataObjects: [] as DataObjectFragment[],
              },
            },
          ] as ExperienceFragment_entries_edges[],
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

    // mockGetUnsyncedExperience
    //   .mockReturnValueOnce({
    //     ownFields: {
    //       title: true,
    //     },
    //   }) //  9
    //   .mockReturnValueOnce({
    //     newEntries: true,
    //     ownFields: {
    //       title: true,
    //     },
    //   }); // 10

    // mockUpdateExperiencesOnline
    //   .mockResolvedValueOnce({
    //     data: {
    //       updateExperiences: {
    //         __typename: "UpdateExperiencesSomeSuccess",
    //         experiences: [
    //           {
    //             __typename: "UpdateExperienceSomeSuccess",
    //             experience: {
    //               ownFields: {
    //                 __typename: "UpdateExperienceOwnFieldsErrors",
    //                 errors: {},
    //               },
    //               newEntries: [
    //                 {
    //                   __typename: "CreateEntryErrors",
    //                   errors: {
    //                     error: null,
    //                     clientId: "a",
    //                     dataObjects: [
    //                       {
    //                         definition: null,
    //                         data: "a",
    //                       },
    //                     ],
    //                   },
    //                 },
    //                 {
    //                   __typename: "CreateEntrySuccess",
    //                 },
    //               ],
    //               updatedDefinitions: [
    //                 {
    //                   __typename: "DefinitionErrors",
    //                   errors: {
    //                     error: null,
    //                     name: "a",
    //                   },
    //                 },
    //                 {
    //                   __typename: "DefinitionSuccess",
    //                 },
    //               ],
    //             },
    //           },
    //         ],
    //       },
    //     },
    //   } as UpdateExperiencesOnlineMutationResult) // 9
    //   .mockResolvedValueOnce({
    //     data: {
    //       updateExperiences: {
    //         __typename: "UpdateExperiencesSomeSuccess",
    //         experiences: [
    //           {
    //             __typename: "UpdateExperienceSomeSuccess",
    //             experience: {
    //               ownFields: {
    //                 __typename: "ExperienceOwnFieldsSuccess",
    //               },
    //             },
    //           },
    //         ],
    //       },
    //     },
    //   } as UpdateExperiencesOnlineMutationResult); // 10

    /**
     * When component is rendered
     */
    render(ui);

    /**
     * Then error UI should not be visible
     */
    expect(document.getElementById(errorsNotificationId)).toBeNull();

    mockGetUnsyncedExperience.mockReturnValueOnce(null);
    mockUpdateExperiencesOnline.mockResolvedValueOnce(null);

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

    mockGetUnsyncedExperience.mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    });

    mockUpdateExperiencesOnline.mockReset();
    mockUpdateExperiencesOnline.mockResolvedValueOnce({});

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

    expect(
      mockUpdateExperiencesOnline.mock.calls[0][0].variables.input,
    ).toEqual([
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

    mockGetUnsyncedExperience.mockReturnValueOnce({
      definitions: {
        "2": {
          name: true,
        },
      },
    });

    mockUpdateExperiencesOnline.mockReset();
    mockUpdateExperiencesOnline.mockRejectedValueOnce(new Error("a"));

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

    expect(
      mockUpdateExperiencesOnline.mock.calls[0][0].variables.input,
    ).toEqual([
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

    mockGetUnsyncedExperience.mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    });

    mockUpdateExperiencesOnline.mockRejectedValueOnce(
      new ApolloError({
        networkError: new Error("n"),
      }),
    );

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

    mockGetUnsyncedExperience.mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    });

    mockUpdateExperiencesOnline.mockRejectedValueOnce(
      new ApolloError({
        graphQLErrors: [new GraphQLError("a")],
      }),
    );

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

    mockGetUnsyncedExperience.mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    });

    mockUpdateExperiencesOnline.mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesAllFail",
          error: "a",
        },
      },
    } as UpdateExperiencesOnlineMutationResult);

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

    mockGetUnsyncedExperience.mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    });

    mockUpdateExperiencesOnline.mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceErrors",
              errors: {
                error: "a",
              },
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult); // 7

    /**
     * When sync button is clicked
     */
    syncBtn.click();
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

    mockGetUnsyncedExperience.mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    });

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
    expect(
      document.getElementById(
        offlineExperienceSyncedNotificationSuccessSelector,
      ),
    ).toBeNull();

    mockGetUnsyncedExperience.mockReturnValueOnce({
      ownFields: {
        title: true,
      },
    }); //  9

    mockUpdateExperiencesOnline.mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceSomeSuccess",
              experience: {
                ownFields: {
                  __typename: "UpdateExperienceOwnFieldsErrors",
                  errors: {},
                },
                newEntries: [
                  {
                    __typename: "CreateEntryErrors",
                    errors: {
                      error: null,
                      clientId: "a",
                      dataObjects: [
                        {
                          meta: {
                            index: 0,
                          },
                          definition: null,
                          data: "a",
                        },
                      ],
                    },
                  },
                  {
                    __typename: "CreateEntrySuccess",
                  },
                ],
                updatedDefinitions: [
                  {
                    __typename: "DefinitionErrors",
                    errors: {
                      error: null,
                      name: "a",
                    },
                  },
                  {
                    __typename: "DefinitionSuccess",
                  },
                ],
              },
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult); // 9

    /**
     * When sync button is clicked
     */
    syncBtn.click(); // 9
    await wait(() => true);

    /**
     * Then success and error notifications should be visible
     */
    let errorNotifications = (null as unknown) as HTMLCollection;

    const onSyncErrorNotificationDom = await waitForElement(() => {
      errorNotifications = document.getElementsByClassName(
        onOnlineExperienceSyncedNotificationErrorDom,
      );

      return errorNotifications.item(0) as HTMLElement;
    });

    expect(errorNotifications).toHaveLength(3);

    expect(
      document.getElementsByClassName(
        onlineExperienceSyncedNotificationSuccessDom,
      ),
    ).toHaveLength(2);

    /**
     * When one of the success notifications is closed
     */
    (onSyncErrorNotificationDom
      .getElementsByClassName("delete")
      .item(0) as HTMLElement).click();

    expect(errorNotifications).toHaveLength(2);

    mockGetUnsyncedExperience.mockReturnValueOnce({
      newEntries: true,
      ownFields: {
        title: true,
      },
    });

    mockUpdateExperiencesOnline.mockResolvedValueOnce({
      data: {
        updateExperiences: {
          __typename: "UpdateExperiencesSomeSuccess",
          experiences: [
            {
              __typename: "UpdateExperienceSomeSuccess",
              experience: {
                ownFields: {
                  __typename: "ExperienceOwnFieldsSuccess",
                },
              },
            },
          ],
        },
      },
    } as UpdateExperiencesOnlineMutationResult);

    /**
     * When sync button is clicked
     */
    syncBtn.click();
    await wait(() => true);

    /**
     * Then sync success notification should be visible
     */
    const syncSuccessNotification = await waitForElement(() => {
      return document
        .getElementsByClassName(onlineExperienceSyncedNotificationSuccessDom)
        .item(0) as HTMLElement;
    });

    /**
     * And sync error notification should not be visible
     */
    expect(
      document.getElementsByClassName(
        onOnlineExperienceSyncedNotificationErrorDom,
      ),
    ).toHaveLength(0);

    /**
     * When sync error notification dismiss button is clicked
     */
    syncSuccessNotification.click();
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
    (document
      .getElementsByClassName(newEntryTriggerSelector)
      .item(0) as HTMLElement).click();

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
    mockCreateExperiences.mockRejectedValueOnce(new Error("a")); // 1
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

    mockCreateExperiences.mockRejectedValueOnce(
      new ApolloError({
        networkError: new Error("a"),
      }),
    );
    syncBtn.click();
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
    mockCreateExperiences.mockRejectedValueOnce(
      new ApolloError({
        graphQLErrors: [new GraphQLError("a")],
      }),
    );
    syncBtn.click();
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
    mockCreateExperiences.mockResolvedValueOnce({
      data: {
        createExperiences: [],
      },
    } as CreateExperiencesMutationResult);
    syncBtn.click();
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
    mockCreateExperiences.mockResolvedValueOnce({
      data: {
        createExperiences: [
          {
            __typename: "CreateExperienceErrors",
            errors: {},
          },
        ],
      },
    } as CreateExperiencesMutationResult);
    syncBtn.click();
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
    mockCreateExperiences.mockResolvedValueOnce({
      data: {
        createExperiences: [
          {
            __typename: "ExperienceSuccess",
            entriesErrors: [{}],
          },
        ],
      },
    } as CreateExperiencesMutationResult);
    syncBtn.click();
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
    expect(
      mockSaveOnSyncOfflineExperienceComponentSuccess,
    ).not.toHaveBeenCalled();
    expect(mockRemoveUnsyncedExperience).not.toHaveBeenCalled();
    expect(mockPersistFunc).not.toHaveBeenCalled();

    /**
     * When sync button is clicked
     */
    mockCreateExperiences.mockResolvedValueOnce({
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
    } as CreateExperiencesMutationResult);
    syncBtn.click();
    await wait(() => true);
    jest.runAllTimers();

    /**
     * And cache cleanup functions should be invoked
     */
    expect(mockPersistFunc).toHaveBeenCalled();
    expect(mockRemoveUnsyncedExperience.mock.calls[0][0]).toBe(experienceId);

    expect(
      mockSaveOnSyncOfflineExperienceComponentSuccess.mock.calls[0][0],
    ).toEqual([experienceId, "e1", "a"]);

    /**
     * And error UI should not be visible
     */
    expect(document.getElementById(errorsNotificationId)).toBeNull();
  });

  test("delete offline experience", async () => {
    const experienceId = makeOfflineId(1);

    const { ui, mockNavigate } = makeComp({
      experience: {
        id: experienceId,
        title: "t1",
        entries: {
          edges: [] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
    });

    /**
     * When component is rendered
     */
    render(ui);

    /**
     * Then delete prompt should not be visible
     */
    expect(document.getElementById(cancelDeleteExperienceDomId)).toBeNull();

    /**
     * When delete experience menu is clicked
     */
    const deleteExperienceMenuDom = document.getElementById(
      makeDeleteMenuDomId(experienceId),
    ) as HTMLElement;

    deleteExperienceMenuDom.click();

    /**
     * Then delete prompt should be visible
     */
    const cancelDeleteExperienceDom = document.getElementById(
      cancelDeleteExperienceDomId,
    ) as HTMLElement;

    /**
     * When user cancels experience deletion
     */
    cancelDeleteExperienceDom.click();

    /**
     * Then delete prompt should not be visible
     */
    expect(document.getElementById(cancelDeleteExperienceDomId)).toBeNull();
    expect(document.getElementById(okDeleteExperienceDomId)).toBeNull();

    /**
     * When delete experience menu is clicked
     */
    deleteExperienceMenuDom.click();

    /**
     * Then delete experience should be visible, and when clicked
     */
    (document.getElementById(okDeleteExperienceDomId) as HTMLElement).click();
    await wait(() => true);

    /**
     * Experience should be deleted
     */
    expect(mockDeleteExperiencesFromCache.mock.calls[0][2]).toEqual([
      experienceId,
    ]);

    expect(mockWriteDeletedExperienceTitle.mock.calls[0][0]).toBe("t1");
    expect(mockPersistFunc.mock.calls).toHaveLength(1);
    expect(mockNavigate).toHaveBeenCalled();
  });

  test("delete online experience when there is connection", async () => {
    mockDeleteExperiences
      .mockRejectedValueOnce(new Error("a")) // 1
      .mockResolvedValueOnce({} as DeleteExperiencesMutationResult) // 2
      .mockResolvedValueOnce({
        data: {
          deleteExperiences: {
            __typename: "DeleteExperiencesAllFail",
            error: "a",
          },
        },
      } as DeleteExperiencesMutationResult) // 3
      .mockResolvedValueOnce({
        data: {
          deleteExperiences: {
            __typename: "DeleteExperiencesSomeSuccess",
            experiences: [
              {
                __typename: "DeleteExperienceErrors",
                errors: {
                  error: "b",
                },
              },
            ],
          },
        },
      } as DeleteExperiencesMutationResult) // 4
      .mockResolvedValueOnce({
        data: {
          deleteExperiences: {
            __typename: "DeleteExperiencesSomeSuccess",
            experiences: [
              {
                __typename: "DeleteExperienceSuccess",
              },
            ],
          },
        },
      } as DeleteExperiencesMutationResult); // 5

    mockConfirmShouldDeleteExperience.mockResolvedValue(true);

    const experienceId = "ex";

    const { ui, mockNavigate } = makeComp({
      experience: {
        id: experienceId,
        title: "t1",
        entries: {
          edges: [] as ExperienceFragment_entries_edges[],
        },
      } as ExperienceFragment,
      hasUnsaved: true,
    });

    /**
     * When component is rendered
     */
    render(ui);

    /**
     * Then error notification should not be visible
     */
    expect(document.getElementById(errorsNotificationId)).toBeNull();

    /**
     * When experience deletion is confirmed
     */
    (document.getElementById(okDeleteExperienceDomId) as HTMLElement).click();
    await wait(() => true);

    /**
     * Error notification should be visible
     */
    let errorsNotificationDom = await waitForElement(() => {
      return document.getElementById(errorsNotificationId) as HTMLElement;
    });

    /**
     * When error notification is dismissed
     */
    (errorsNotificationDom
      .getElementsByClassName(closeSubmitNotificationBtnSelector)
      .item(0) as HTMLElement).click();

    /**
     * Then error notification should not be visible
     */
    expect(document.getElementById(errorsNotificationId)).toBeNull();

    //////////////////////////  ////////////////////////////

    /**
     * When delete experience menu is clicked - 2
     */
    (document.getElementById(
      makeDeleteMenuDomId(experienceId),
    ) as HTMLElement).click();

    (document.getElementById(okDeleteExperienceDomId) as HTMLElement).click();
    await wait(() => true);

    /**
     * Error notification should be visible
     */
    errorsNotificationDom = await waitForElement(() => {
      return document.getElementById(errorsNotificationId) as HTMLElement;
    });

    /**
     * When error notification is dismissed
     */
    (errorsNotificationDom
      .getElementsByClassName(closeSubmitNotificationBtnSelector)
      .item(0) as HTMLElement).click();

    /**
     * Then error notification should not be visible
     */
    expect(document.getElementById(errorsNotificationId)).toBeNull();
    //////////////////////////  ////////////////////////////

    /**
     * When delete experience menu is clicked - 3
     */
    (document.getElementById(
      makeDeleteMenuDomId(experienceId),
    ) as HTMLElement).click();

    (document.getElementById(okDeleteExperienceDomId) as HTMLElement).click();
    await wait(() => true);

    /**
     * Error notification should be visible
     */
    errorsNotificationDom = await waitForElement(() => {
      return document.getElementById(errorsNotificationId) as HTMLElement;
    });

    /**
     * When error notification is dismissed
     */
    (errorsNotificationDom
      .getElementsByClassName(closeSubmitNotificationBtnSelector)
      .item(0) as HTMLElement).click();

    /**
     * Then error notification should not be visible
     */
    expect(document.getElementById(errorsNotificationId)).toBeNull();

    /**
     * When delete experience menu is clicked - 4
     */
    (document.getElementById(
      makeDeleteMenuDomId(experienceId),
    ) as HTMLElement).click();

    (document.getElementById(okDeleteExperienceDomId) as HTMLElement).click();
    await wait(() => true);

    /**
     * Error notification should be visible
     */
    errorsNotificationDom = await waitForElement(() => {
      return document.getElementById(errorsNotificationId) as HTMLElement;
    });

    /**
     * When error notification is dismissed
     */
    (errorsNotificationDom
      .getElementsByClassName(closeSubmitNotificationBtnSelector)
      .item(0) as HTMLElement).click();

    /**
     * Then error notification should not be visible
     */
    expect(document.getElementById(errorsNotificationId)).toBeNull();

    /**
     * When delete experience menu is clicked - 5
     */
    (document.getElementById(
      makeDeleteMenuDomId(experienceId),
    ) as HTMLElement).click();

    (document.getElementById(okDeleteExperienceDomId) as HTMLElement).click();
    await wait(() => true);
    await wait(() => true);

    /**
     * Experience should be deleted
     */
    expect(mockDeleteExperiencesFromCache.mock.calls[0][2]).toEqual([
      experienceId,
    ]);

    await wait(() => true);

    expect(mockRemoveQueriesAndMutationsFromCache).toHaveBeenCalled();
    expect(mockWriteDeletedExperienceTitle.mock.calls[0][0]).toBe("t1");
    expect(mockPersistFunc.mock.calls).toHaveLength(1);
    expect(mockNavigate).toHaveBeenCalled();
  });
});

describe("reducer", () => {
  test("trivial", () => {
    const prevState = initState({ experience: {} } as Props);

    expect(
      reducer(prevState, { type: ActionType.ABORTED }).states.editExperience
        .value,
    ).toEqual(StateValue.idle);

    expect(
      reducer(prevState, { type: ActionType.EDIT_EXPERIENCE }).states
        .editExperience.value,
    ).toEqual(StateValue.editing);

    expect(
      reducer(prevState, { type: ActionType.COMPLETED }).states.editExperience
        .value,
    ).toEqual(StateValue.idle);

    expect(prevState.context.offlineExperienceNewlySynced).not.toBe(true);

    expect(
      reducer(prevState, {
        type: ActionType.SET_OFFLINE_EXPERIENCE_NEWLY_SYNCED,
        value: true,
      }).context.offlineExperienceNewlySynced,
    ).toBe(true);
  });

  test("sync edited offline experience", async () => {
    const experience = {
      id: "1",
      entries: {
        edges: [] as any,
      },
      dataDefinitions: [] as any,
    } as ExperienceFragment;

    const mockOnError = jest.fn();

    const props = {
      createExperiences: mockCreateExperiences as any,
    } as Props;

    const mockDispatch = jest.fn();
    const effectArgs = { dispatch: mockDispatch as any } as EffectArgs;

    const prevState = initState({ experience: {} } as Props);

    const nextState = reducer(prevState, {
      type: ActionType.SYNC_EDITED_OFFLINE_EXPERIENCE,
      experience,
      onError: mockOnError,
    });

    const args = (nextState.effects.general as EffectState).hasEffects.context
      .effects[0] as DefSyncOfflineEditedExperienceEffect;

    expect(args).toEqual({
      key: "syncEditedOfflineExperienceEffect",
      ownArgs: { experience, onError: mockOnError },
    });

    /**
     * SUBMISSIONS
     * 1. javascript exception
     * 2. Invalid response
     * 3. CreateExperienceErrors
     * 4. ExperienceSuccess.entriesErrors
     * 5. ExperienceSuccess no entriesErrors
     */
    mockCreateExperiences
      .mockRejectedValueOnce(new Error("a")) // 1
      .mockResolvedValueOnce({
        data: {
          createExperiences: [],
        },
      } as CreateExperiencesMutationResult) // 2
      .mockResolvedValueOnce({
        data: {
          createExperiences: [
            {
              __typename: "CreateExperienceErrors",
              errors: {},
            },
          ],
        },
      } as CreateExperiencesMutationResult) // 3
      .mockResolvedValueOnce({
        data: {
          createExperiences: [
            {
              __typename: "ExperienceSuccess",
              entriesErrors: [{}],
            },
          ],
        },
      } as CreateExperiencesMutationResult) // 4
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
      } as CreateExperiencesMutationResult); // 5

    // 1
    expect(mockOnError).not.toHaveBeenCalled();
    effectFunctions[args.key](args.ownArgs, props, effectArgs);
    expect(mockDispatch).not.toHaveBeenCalled();
    await wait(() => true);
    expect(mockOnError).toHaveBeenCalled();

    // 2
    mockOnError.mockReset();
    expect(mockOnError).not.toHaveBeenCalled();
    effectFunctions[args.key](args.ownArgs, props, effectArgs);
    expect(mockDispatch).not.toHaveBeenCalled();
    await wait(() => true);
    expect(mockOnError).toHaveBeenCalled();

    // 3
    mockOnError.mockReset();
    expect(mockOnError).not.toHaveBeenCalled();
    effectFunctions[args.key](args.ownArgs, props, effectArgs);
    expect(mockDispatch).not.toHaveBeenCalled();
    await wait(() => true);
    expect(mockOnError).toHaveBeenCalled();

    // 4
    mockOnError.mockReset();
    expect(mockOnError).not.toHaveBeenCalled();
    effectFunctions[args.key](args.ownArgs, props, effectArgs);
    await wait(() => true);
    expect(mockOnError).toHaveBeenCalled();

    // 5
    mockOnError.mockReset();
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockRemoveUnsyncedExperience).not.toHaveBeenCalled();
    effectFunctions[args.key](args.ownArgs, props, effectArgs);
    await wait(() => true);
    expect(mockOnError).not.toHaveBeenCalled();
    expect(mockRemoveUnsyncedExperience.mock.calls[0][0]).toBe("1");

    // 6
  });
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
        deleteExperiences={mockDeleteExperiences}
      />
    ),
    mockNavigate,
  };
}
