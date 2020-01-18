/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import {
  render,
  fireEvent,
  wait,
  waitForElement,
  cleanup,
} from "@testing-library/react";
import { UploadOfflineItemsComponent } from "../components/UploadOfflineItems/upload-offline.component";
import {
  ComponentProps,
  definitionToUploadData,
  ExperiencesIdsToObjectMap,
  StateValue,
  initState,
  reducer,
  ActionType,
} from "../components/UploadOfflineItems/upload-offline.utils";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges_node_dataObjects,
  ExperienceFragment_dataDefinitions,
} from "../graphql/apollo-types/ExperienceFragment";
import { makeOfflineId, noop, makeApolloCacheRef } from "../constants";
import {
  renderWithRouter,
  makeDataDefinitions,
  makeEntryNode,
  closeMessage,
} from "./test_utils";
import { CreateOnlineEntryMutationVariables } from "../graphql/apollo-types/CreateOnlineEntryMutation";
import {
  UploadOfflineItemsMutation,
  UploadOfflineItemsMutation_createEntries,
  UploadOfflineItemsMutation_saveOfflineExperiences,
} from "../graphql/apollo-types/UploadOfflineItemsMutation";
import { Props as EntryProps } from "../components/Entry/entry.utils";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import { EXPERIENCES_URL } from "../routes";
import { GetOfflineItemsSummary } from "../components/UploadOfflineItems/upload-offline.resolvers";
import { isConnected } from "../state/connections";
import { Entry } from "../components/Entry/entry.component";
import { scrollIntoView } from "../components/scroll-into-view";
import { updateCache } from "../components/UploadOfflineItems/update-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../apollo-cache/update-get-experiences-mini-query";
import {
  wipeReferencesFromCache,
  removeQueriesAndMutationsFromCache,
} from "../state/resolvers/delete-references-from-cache";
import { purgeIdsFromOfflineItemsLedger } from "../apollo-cache/delete-experiences-ids-from-offline-items";
import {
  makeExperienceComponentId,
  createdOnlineExperiencesContainerId,
  createdOfflineExperiencesContainerId,
  makeExperienceUploadStatusClassNames,
  makeUploadStatusIconId,
  makeEntryDomId,
  makeExperienceErrorId,
  uploadBtnDomId,
  offlineExperiencesTabMenuDomId,
} from "../components/UploadOfflineItems/upload-offline.dom";
import { EXPERIENCE_TYPE_NAME, ENTRY_TYPE_NAME } from "../graphql/types";

const mockLoadingId = "a-lo";
jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id={mockLoadingId} />,
}));

jest.mock("../components/SidebarHeader/sidebar-header.component", () => ({
  SidebarHeader: ({ children }: any) => {
    return <> {children} </>;
  },
}));

jest.mock("../components/Entry/entry.component", () => ({
  Entry: jest.fn((props: any) => {
    return <div className={props.className} id={props.id} />;
  }),
}));

jest.mock("../components/Experience/loadables", () => ({
  EditExperience: () => <div className="js-editor" />,

  EditEntry: () => <div id="entry-edit-modal" />,
}));

jest.mock("../state/connections");
jest.mock("../components/scroll-into-view");
jest.mock("../components/UploadOfflineItems/update-cache");
jest.mock("../apollo-cache/update-get-experiences-mini-query");

jest.mock("../state/resolvers/delete-references-from-cache");
const mockPurgeIdsFromOfflineItemsLedger = purgeIdsFromOfflineItemsLedger as jest.Mock;

jest.mock("../apollo-cache/delete-experiences-ids-from-offline-items.ts");
jest.mock("../components/UploadOfflineItems/upload-offline.resolvers");

const mockIsConnected = isConnected as jest.Mock;
const mockEntry = Entry as jest.Mock;
const mockScrollIntoView = scrollIntoView as jest.Mock;
const mockUpdateCache = updateCache as jest.Mock;
const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;
const mockWipeReferencesFromCache = wipeReferencesFromCache as jest.Mock;
const mockUploadAllOfflineItems = jest.fn();
const mockCreateEntries = jest.fn();
const mockLayoutDispatch = jest.fn();
const mockRemoveQueriesAndMutationsFromCache = removeQueriesAndMutationsFromCache as jest.Mock;
const mockUploadOfflineExperiences = jest.fn();

////////////////////////// END MOCK ////////////////////////////

beforeEach(() => {
  jest.useFakeTimers();
  mockWipeReferencesFromCache.mockReset();
  mockUpdateCache.mockReset();
  mockScrollIntoView.mockReset();
  mockIsConnected.mockReset();
  mockEntry.mockClear();
  mockCreateEntries.mockReset();
  mockUploadOfflineExperiences.mockReset();
  mockUploadAllOfflineItems.mockReset();
  mockPurgeIdsFromOfflineItemsLedger.mockReset();
  mockReplaceExperiencesInGetExperiencesMiniQuery.mockReset();
  mockRemoveQueriesAndMutationsFromCache.mockReset();
  mockLayoutDispatch.mockReset();
});

afterEach(() => {
  jest.clearAllTimers();
  cleanup();
});

const timeStamps = { insertedAt: "a", updatedAt: "a" };

describe("components", () => {
  it("redirects to 404 when not connected", async () => {
    mockIsConnected.mockReturnValue(false);

    const { ui, mockNavigate } = makeComp();
    render(ui);
    expect(mockNavigate).toHaveBeenCalled();
    expect(document.getElementById("a-lo")).toBeNull();
  });

  it("renders loading indicator", () => {
    /**
     * Given we are loading data
     */
    const { ui } = makeComp({
      allOfflineItems: {} as any,
      loading: true,
    });

    /**
     * While component is rendering
     */
    render(ui);

    /**
     * Then we should see loading indicator
     */
    expect(document.getElementById(mockLoadingId)).not.toBeNull();
  });

  it("redirects to 404 when there are no offline data", async () => {
    const { ui, mockNavigate } = makeComp({
      allOfflineItems: {
        completelyOfflineCount: 0,
        partlyOfflineCount: 0,
      } as GetOfflineItemsSummary,
    });

    render(ui);

    expect(mockNavigate).toHaveBeenCalled();
    expect(document.getElementById(mockLoadingId)).toBeNull();
  });

  it("shows only part offline experiences, no online entries and uploads all entries successfully", async () => {
    mockIsConnected.mockReturnValue(true);

    const { id: entryId, ...entry } = {
      ...makeEntryNode(makeOfflineId("1")),
      clientId: "a",
      experienceId: "1",
    };

    const offlineEntry = {
      ...entry,
      id: entryId,
    } as ExperienceFragment_entries_edges_node;

    const onlineEntry = {
      id: "2",
    } as ExperienceFragment_entries_edges_node;

    const experience = {
      id: "1",
      title: "a",
      entries: {
        edges: [
          {
            node: offlineEntry,
          },
          {
            node: onlineEntry,
          },
        ],
      },
    } as ExperienceFragment;

    mockCreateEntries.mockResolvedValue({
      data: {
        createEntries: [
          {
            experienceId: "1",
            entries: [{}],
          },
        ],
      },
    });

    const { ui } = makeComp({
      allOfflineItems: {
        partialOnlineMap: {
          "1": {
            experience,
            offlineEntries: [offlineEntry],
          },
        } as ExperiencesIdsToObjectMap,

        partlyOfflineCount: 1,
      } as GetOfflineItemsSummary,
    });

    const domOfflineTitle1Id = makeExperienceComponentId(1, StateValue.online);

    const { unmount } = render(ui);

    expect(
      document.getElementById("upload-unsaved-tab-menu-partly-saved"),
    ).not.toBeNull();

    expect(
      document.getElementById(createdOfflineExperiencesContainerId),
    ).toBeNull();

    expect(document.getElementById(offlineExperiencesTabMenuDomId)).toBeNull();

    expect(
      (document.getElementById(domOfflineTitle1Id) as any).classList,
    ).not.toContain("success");

    expect(
      document.getElementById(makeUploadStatusIconId(1, "success")),
    ).toBeNull();

    expect(
      document.getElementById("upload-triggered-success-icon-partly-saved"),
    ).toBeNull();

    const tabsMenuClassList = (document.getElementById(
      "upload-unsaved-tabs-menu",
    ) as any).classList;

    expect(tabsMenuClassList).toContain("one");
    expect(tabsMenuClassList).not.toContain("two");

    /**
     * When we click on partly saved tab menu
     */

    (document.getElementById(
      "upload-unsaved-tab-menu-partly-saved",
    ) as any).click();

    jest.runAllTimers();

    /**
     * Then partly saved experience should continue to be visible
     * (there is only one tab)
     */

    expect(
      document.getElementById(createdOnlineExperiencesContainerId),
    ).not.toBeNull();

    fireEvent.click(document.getElementById(uploadBtnDomId) as any);

    const domOnlineTitle1Id = makeExperienceComponentId(1, StateValue.online);

    const $elm = await waitForElement(() => {
      return document.getElementById(domOnlineTitle1Id) as HTMLElement;
    });

    expect(mockCreateEntries).toHaveBeenCalled();

    expect($elm.classList).toContain(
      makeExperienceUploadStatusClassNames(true)[1],
    );

    const uploadedEntry = ((mockCreateEntries.mock.calls[0][0] as any)
      .variables as CreateOnlineEntryMutationVariables).input[0];

    expect(uploadedEntry).toEqual(entry);

    expect(mockUploadOfflineExperiences).not.toHaveBeenCalled();
    expect(mockUploadAllOfflineItems).not.toHaveBeenCalled();

    expect(document.getElementById(uploadBtnDomId)).toBeNull();

    expect(
      document.getElementById(makeUploadStatusIconId(1, "success")),
    ).not.toBeNull();

    expect(
      document.getElementById("upload-triggered-success-icon-partly-saved"),
    ).not.toBeNull();

    expect(mockUpdateCache).toHaveBeenCalled();
    unmount();
    expect(mockRemoveQueriesAndMutationsFromCache).toHaveBeenCalled();
  });

  it("shows only offline experiences and uploading all succeeds", async () => {
    mockIsConnected.mockReturnValue(true);

    const experience = {
      title: "a",
      clientId: "1",
      description: "x",
      dataDefinitions: makeDataDefinitions(),
      ...timeStamps,
    } as ExperienceFragment;

    const { id: entryId, ...entry } = {
      ...makeEntryNode(),
      clientId: "b",
      experienceId: "1",
      ...timeStamps,
    };

    const unsavedEntry = {
      ...entry,
      id: entryId,
    } as ExperienceFragment_entries_edges_node;

    const unsavedExperience = {
      id: "1",
      ...experience,
      entries: {
        edges: [
          {
            node: unsavedEntry,
          },
        ],
      },
    } as ExperienceFragment;

    const { ui } = makeComp({
      allOfflineItems: {
        completelyOfflineCount: 1,
        completelyOfflineMap: {
          "1": {
            experience: unsavedExperience,
            offlineEntries: [unsavedEntry],
            onlineEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetOfflineItemsSummary,
    });

    mockUploadOfflineExperiences.mockResolvedValue({
      data: {
        saveOfflineExperiences: [
          {
            experience: unsavedExperience,
          },
        ],
      },
    });

    const { unmount } = render(ui);

    expect(
      document.getElementById(createdOnlineExperiencesContainerId),
    ).toBeNull();

    expect(
      document.getElementById("upload-unsaved-tab-menu-partly-saved"),
    ).toBeNull();

    expect(
      document.getElementById(createdOfflineExperiencesContainerId),
    ).not.toBeNull();

    expect(
      document.getElementById(offlineExperiencesTabMenuDomId),
    ).not.toBeNull();

    expect(
      document.getElementById("uploaded-success-tab-icon-never-saved"),
    ).toBeNull();

    const domTitle1Id = makeExperienceComponentId(1, StateValue.offline);

    expect(
      (document.getElementById(domTitle1Id) as any).classList,
    ).not.toContain("success");

    expect(
      document.getElementById(makeUploadStatusIconId(1, "error")),
    ).toBeNull();

    expect(
      document.getElementById(makeUploadStatusIconId(1, "success")),
    ).toBeNull();

    const tabsMenuClassList = (document.getElementById(
      "upload-unsaved-tabs-menu",
    ) as any).classList;

    expect(tabsMenuClassList).toContain("one");
    expect(tabsMenuClassList).not.toContain("two");

    /**
     * When we click on never saved tab menu
     */

    (document.getElementById(offlineExperiencesTabMenuDomId) as any).click();

    jest.runAllTimers();

    /**
     * Then never saved experience should continue to be visible
     * (there is only one tab)
     */

    expect(
      document.getElementById(createdOfflineExperiencesContainerId),
    ).not.toBeNull();

    fireEvent.click(document.getElementById(uploadBtnDomId) as any);

    const $successIcon = await waitForElement(() =>
      document.getElementById("uploaded-success-tab-icon-never-saved"),
    );

    expect($successIcon).not.toBeNull();

    const {
      entries: uploadedEntries,

      ...otherExperienceFields
    } = (mockUploadOfflineExperiences.mock
      .calls[0][0] as any).variables.input[0];

    experience.dataDefinitions = experience.dataDefinitions.map(
      definitionToUploadData as any,
    );

    expect(otherExperienceFields).toEqual(experience);

    expect(uploadedEntries[0]).toEqual(entry);

    expect(mockCreateEntries).not.toHaveBeenCalled();
    expect(mockUploadAllOfflineItems).not.toHaveBeenCalled();

    expect(document.getElementById(uploadBtnDomId)).toBeNull();

    expect((document.getElementById(domTitle1Id) as any).classList).toContain(
      makeExperienceUploadStatusClassNames(true)[1],
    );

    expect(
      document.getElementById(makeUploadStatusIconId(1, "success")),
    ).not.toBeNull();

    expect(mockUpdateCache).toHaveBeenCalled();
    unmount();
    expect(mockRemoveQueriesAndMutationsFromCache).toHaveBeenCalled();
  });

  it("toggles partly and never saved, uploads but returns errors for all never saved", async () => {
    const entryId = makeOfflineId("1");

    const unsavedExperienceEntry = {
      ...makeEntryNode("1"),
      clientId: "1",
    } as ExperienceFragment_entries_edges_node;

    const savedExperienceEntry = {
      ...makeEntryNode(entryId),
      clientId: entryId,
    } as ExperienceFragment_entries_edges_node;

    const { ui } = makeComp({
      allOfflineItems: {
        completelyOfflineCount: 1,

        completelyOfflineMap: {
          "1": {
            experience: {
              id: "1",
              title: "a",
              clientId: "1",
              dataDefinitions: makeDataDefinitions(),

              entries: {
                edges: [
                  {
                    node: unsavedExperienceEntry,
                  },
                ],
              },
            } as ExperienceFragment,

            offlineEntries: [unsavedExperienceEntry],

            onlineEntries: [],
          },
        } as ExperiencesIdsToObjectMap,

        partlyOfflineCount: 1,

        partialOnlineMap: {
          "2": {
            experience: {
              id: "2",
              title: "a",
              dataDefinitions: makeDataDefinitions(),

              entries: {
                edges: [
                  {
                    node: savedExperienceEntry,
                  },
                ],
              },
            } as ExperienceFragment,

            offlineEntries: [savedExperienceEntry],

            onlineEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetOfflineItemsSummary,
    });

    mockUploadAllOfflineItems.mockResolvedValue({
      data: {
        createEntries: [
          {
            errors: [
              {
                clientId: entryId,
                errors: {
                  clientId: `${entryId} error`,
                },
              },
            ],

            experienceId: "2",
          },
        ] as UploadOfflineItemsMutation_createEntries[],

        saveOfflineExperiences: [
          {
            experienceErrors: {
              clientId: "1",
              errors: {
                title: "experience error",
                user: "",
                __typename: "CreateExperienceErrors",
              },
            },
          },
        ] as UploadOfflineItemsMutation_saveOfflineExperiences[],
      } as UploadOfflineItemsMutation,
    });

    /**
     * When component is rendered
     */

    render(ui);

    /**
     * Then part offline experiences should be visible
     */

    expect(
      document.getElementById(createdOnlineExperiencesContainerId),
    ).not.toBeNull();

    /**
     * And offline experiences should not be visible
     */

    expect(
      document.getElementById(createdOfflineExperiencesContainerId),
    ).toBeNull();

    const tabsMenuClassList = (document.getElementById(
      "upload-unsaved-tabs-menu",
    ) as any).classList;

    /**
     * And tabs menu should show that not one but two tabs are used
     */

    expect(tabsMenuClassList).not.toContain("one");
    expect(tabsMenuClassList).toContain("two");

    /**
     * When we click on offline experiences tab menu
     */

    const $neverSavedTabMenu = document.getElementById(
      offlineExperiencesTabMenuDomId,
    ) as HTMLElement;

    $neverSavedTabMenu.click();

    jest.runAllTimers();

    /**
     * Then offline experiences should be visible
     */

    expect(
      document.getElementById(createdOfflineExperiencesContainerId),
    ).not.toBeNull();

    /**
     * And part offline experience should not be visible
     */

    expect(
      document.getElementById(createdOnlineExperiencesContainerId),
    ).toBeNull();

    /**
     * And part offline experience should not contain any error UI
     */

    const domTitle1Id = makeExperienceComponentId(1, StateValue.offline);

    expect(
      (document.getElementById(domTitle1Id) as any).classList,
    ).not.toContain("error");

    /**
     * When we click on part offline experience tab menu
     */

    const $partlySavedTabMenu = document.getElementById(
      "upload-unsaved-tab-menu-partly-saved",
    ) as any;

    fireEvent.click($partlySavedTabMenu);

    jest.runAllTimers();

    /**
     * Then part offline experiences should become visible
     */

    expect(
      document.getElementById(createdOnlineExperiencesContainerId),
    ).not.toBeNull();

    /**
     * And offline experiences should not be visible
     */

    expect(
      document.getElementById(createdOfflineExperiencesContainerId),
    ).toBeNull();

    const domTitle2Id = makeExperienceComponentId(2, StateValue.online);

    expect(
      (document.getElementById(domTitle2Id) as any).classList,
    ).not.toContain("error");

    const domEntry = document.getElementById(
      makeEntryDomId(entryId),
    ) as HTMLElement;

    expect(domEntry.classList).not.toContain("entry--error");

    expect(
      document.getElementById(makeUploadStatusIconId(1, "error")),
    ).toBeNull();

    expect(
      document.getElementById(makeUploadStatusIconId(2, "error")),
    ).toBeNull();

    expect(
      document.getElementById("upload-triggered-error-icon-partly-saved"),
    ).toBeNull();

    expect(
      document.getElementById("uploaded-error-tab-icon-never-saved"),
    ).toBeNull();

    expect(document.getElementById("unsaved-experience-errors-1")).toBeNull();

    fireEvent.click(document.getElementById(uploadBtnDomId) as any);

    const $error = await waitForElement(() =>
      document.getElementById(makeUploadStatusIconId(2, "error")),
    );

    expect($error).not.toBeNull();

    expect(mockUploadAllOfflineItems).toHaveBeenCalled();

    expect(mockUploadOfflineExperiences).not.toHaveBeenCalled();
    expect(mockCreateEntries).not.toHaveBeenCalled();

    expect(
      document.getElementById("upload-triggered-error-icon-partly-saved"),
    ).not.toBeNull();

    // we are currently showing saved experiences - we confirm it has error class
    expect(
      document.getElementById(createdOnlineExperiencesContainerId),
    ).not.toBeNull();

    expect((document.getElementById(domTitle2Id) as any).classList).toContain(
      makeExperienceUploadStatusClassNames(false, true)[1],
    );

    // we also check to see that correct class has been applied to the entry
    expect(domEntry.classList).toContain("entry--error");

    // we toggle to show unsaved experiences and confirm they also have error
    // class
    fireEvent.click($neverSavedTabMenu);
    jest.runAllTimers();

    expect(
      document.getElementById(createdOfflineExperiencesContainerId),
    ).not.toBeNull();

    expect((document.getElementById(domTitle1Id) as any).classList).toContain(
      makeExperienceUploadStatusClassNames(false, true)[1],
    );

    expect(
      document.getElementById(makeUploadStatusIconId(1, "error")),
    ).not.toBeNull();

    expect(
      document.getElementById("uploaded-error-tab-icon-never-saved"),
    ).not.toBeNull();

    expect(document.getElementById(uploadBtnDomId)).not.toBeNull();

    expect(document.getElementById(makeExperienceErrorId(1))).not.toBeNull();

    expect(mockUpdateCache).not.toHaveBeenCalled();
  });

  it("shows apollo errors", async () => {
    const { ui } = makeComp({
      allOfflineItems: {
        completelyOfflineCount: 1,
        completelyOfflineMap: {
          "1": {
            experience: {
              id: "1",
              title: "a",
              clientId: "1",
              dataDefinitions: [] as ExperienceFragment_dataDefinitions[],

              entries: {
                edges: [
                  {
                    node: {
                      id: "1",
                      clientId: "1",
                    },
                  },
                ],
              },
            } as ExperienceFragment,

            offlineEntries: [
              {
                id: "1",
                clientId: "1",
                dataObjects: [] as ExperienceFragment_entries_edges_node_dataObjects[],
              } as ExperienceFragment_entries_edges_node,
            ],

            onlineEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
        partlyOfflineCount: 1,
        partialOnlineMap: {
          "2": {
            experience: {
              id: "2",
              title: "b",
              dataDefinitions: [] as ExperienceFragment_dataDefinitions[],

              entries: {
                edges: [
                  {
                    node: {
                      id: makeOfflineId("1"),
                      clientId: makeOfflineId("1"),
                    },
                  },
                ],
              },
            } as ExperienceFragment,

            offlineEntries: [
              {
                id: makeOfflineId("1"),
                clientId: makeOfflineId("1"),
                dataObjects: [] as ExperienceFragment_entries_edges_node_dataObjects[],
              } as ExperienceFragment_entries_edges_node,
            ],
            onlineEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetOfflineItemsSummary,
    });

    mockUploadAllOfflineItems.mockRejectedValue(new Error("a"));

    render(ui);

    expect(document.getElementById("upload-unsaved-server-error")).toBeNull();

    fireEvent.click(document.getElementById(uploadBtnDomId) as any);

    const $errorUi = await waitForElement(() =>
      document.getElementById("upload-unsaved-server-error"),
    );

    expect($errorUi).not.toBeNull();

    expect(mockScrollIntoView).toHaveBeenCalledWith(
      "js-scroll-into-view-server-error",
    );

    expect(
      document.getElementById("uploaded-success-tab-icon-never-saved"),
    ).toBeNull();

    expect(
      document.getElementById("uploaded-error-tab-icon-never-saved"),
    ).not.toBeNull();

    expect(
      document.getElementById("upload-triggered-success-icon-partly-saved"),
    ).toBeNull();

    expect(
      document.getElementById("upload-triggered-error-icon-partly-saved"),
    ).not.toBeNull();

    closeMessage($errorUi);

    expect(document.getElementById("upload-unsaved-server-error")).toBeNull();

    expect(
      document.getElementById("uploaded-error-tab-icon-never-saved"),
    ).not.toBeNull();

    expect(
      document.getElementById("upload-triggered-error-icon-partly-saved"),
    ).not.toBeNull();

    expect(mockUpdateCache).not.toHaveBeenCalled();
  });

  it("deletes offline experiences", async () => {
    const { ui, mockNavigate } = makeComp({
      allOfflineItems: {
        completelyOfflineCount: 1,

        completelyOfflineMap: {
          "1": {
            experience: {
              id: "1",
              entries: {
                edges: [
                  {
                    node: {
                      id: "10",
                      clientId: "10",
                    } as ExperienceFragment_entries_edges_node,
                  },
                ],
              },
            } as ExperienceFragment,

            offlineEntries: [
              {
                id: "10",
                clientId: "10",
              } as ExperienceFragment_entries_edges_node,
            ],

            onlineEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetOfflineItemsSummary,
    });

    mockReplaceExperiencesInGetExperiencesMiniQuery.mockResolvedValue({});

    render(ui);

    const $deleteBtn = await waitForElement(
      () => document.getElementById("experience-1-delete-button") as any,
    );

    $deleteBtn.click();

    await wait(() => {
      return true;
    });

    jest.runAllTimers();
    expect(document.getElementById("experience-1-delete-button")).toBeNull();

    expect(
      mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
    ).toEqual({ "1": null });

    expect(mockPurgeIdsFromOfflineItemsLedger.mock.calls[0][1]).toEqual(["1"]);

    expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual([
      makeApolloCacheRef(EXPERIENCE_TYPE_NAME, "1"),
      makeApolloCacheRef(ENTRY_TYPE_NAME, "10"),
    ]);

    expect(mockNavigate).toHaveBeenCalledWith(EXPERIENCES_URL);
    expect(mockLayoutDispatch).toHaveBeenCalled();
  });


  test("experience now online but entry still offline", async () => {
    const offlineExperienceId = "1";
    const newlyOnlineExperienceId = "2";

    const offlineEntry = {
      id: "1",
      clientId: "1",
      dataObjects: [
        {
          definitionId: "f1",
          data: `{"decimal":1}`,
        },
      ],
      experienceId: offlineExperienceId,
      ...timeStamps,
    } as ExperienceFragment_entries_edges_node;

    const offlineExperience = {
      title: "a",
      clientId: offlineExperienceId,
      id: offlineExperienceId,

      entries: {
        edges: [
          {
            node: offlineEntry,
          },
        ],
      },

      dataDefinitions: [
        {
          id: "f1",
          clientId: "f1",
          type: "DECIMAL" as any,
          name: "f1",
        },
      ],

      ...timeStamps,
    } as ExperienceFragment;

    const newlyOnlineExperience = {
      title: "a",
      clientId: offlineExperienceId,
      id: newlyOnlineExperienceId,

      entries: {},

      dataDefinitions: [
        {
          // id will change on successful save
          id: "f2",
          clientId: "f1",
          type: "DECIMAL" as any,
          name: "f1",
        },
      ],
      ...timeStamps,
    } as ExperienceFragment;

    const { ui } = makeComp({
      allOfflineItems: {
        completelyOfflineCount: 1,
        completelyOfflineMap: {
          [offlineExperienceId]: {
            experience: offlineExperience,
            offlineEntries: [offlineEntry],
            onlineEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetOfflineItemsSummary,
    });

    mockUploadOfflineExperiences.mockResolvedValue({
      data: {
        saveOfflineExperiences: [
          {
            experience: newlyOnlineExperience,
            entriesErrors: [
              {
                experienceId: newlyOnlineExperienceId,
                clientId: "1",
                errors: {
                  experienceId: "err",
                },
              },
            ],
          } as UploadOfflineItemsMutation_saveOfflineExperiences,
        ],
      },
    });

    render(ui);

    expect(
      document.getElementById("uploaded-success-tab-icon-never-saved"),
    ).toBeNull();

    expect(
      document.getElementById(
        makeUploadStatusIconId(offlineExperienceId, "error"),
      ),
    ).toBeNull();

    const $uploadBtn = await waitForElement(() => {
      return document.getElementById(uploadBtnDomId) as any;
    });

    fireEvent.click($uploadBtn);

    const $errorIcon = await waitForElement(() =>
      document.getElementById(
        makeUploadStatusIconId(offlineExperienceId, "error"),
      ),
    );

    expect($errorIcon).not.toBeNull();

    expect(document.getElementById(uploadBtnDomId)).not.toBeNull();

    expect(
      document.getElementById(
        makeUploadStatusIconId(offlineExperienceId, "success"),
      ),
    ).toBeNull();

    const { entry } = mockEntry.mock.calls[
      mockEntry.mock.calls.length - 1
    ][0] as EntryProps;

    expect((entry.dataObjects[0] as DataObjectFragment).definitionId).toEqual(
      "f2", // the new definition.id
    );

    expect(mockUpdateCache).toHaveBeenCalled();
  });
});

describe("reducer", () => {
  test("on data loaded", () => {
    const state = initState();
    const nextState = reducer(state, {
      type: ActionType.ON_DATA_LOADED,
      allOfflineItems: {
        partlyOfflineCount: 1,
      } as GetOfflineItemsSummary,
    });

    const { dataLoaded, tabs } = nextState.states;
    expect(dataLoaded.value).toBe(StateValue.yes);
    expect(tabs.value).toBe(StateValue.one);
  });
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const UploadUnsavedP = UploadOfflineItemsComponent as ComponentType<
  Partial<ComponentProps>
>;

function makeComp(props: Partial<ComponentProps> = {}) {
  const { Ui, ...routerProps } = renderWithRouter(UploadUnsavedP);

  return {
    ui: (
      <Ui
        createEntries={mockCreateEntries}
        layoutDispatch={mockLayoutDispatch}
        persistor={{ persist: noop } as any}
        client={{ addResolvers: noop } as any}
        cache={{} as any}
        uploadAllOfflineItems={mockUploadAllOfflineItems}
        uploadOfflineExperiences={mockUploadOfflineExperiences}
        {...props}
      />
    ),
    ...routerProps,
  };
}
