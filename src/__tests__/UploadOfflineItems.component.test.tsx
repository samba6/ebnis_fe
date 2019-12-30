/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType, useState, useEffect } from "react";
import {
  render,
  fireEvent,
  wait,
  waitForElement,
  cleanup,
} from "@testing-library/react";
import { UploadOfflineItems } from "../components/UploadOfflineItems/upload-offline.component";
import {
  Props,
  definitionToUnsavedData,
  ExperiencesIdsToObjectMap,
  onUploadResultsReceived,
  StateMachine,
  ExperienceObjectMap,
  CreationMode,
} from "../components/UploadOfflineItems/upload-offline.utils";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges_node_dataObjects,
  ExperienceFragment_dataDefinitions,
} from "../graphql/apollo-types/ExperienceFragment";
import { makeOfflineId } from "../constants";
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
import {
  GetOfflineItemsSummary,
  GetOfflineItemsQueryResult,
} from "../state/offline-resolvers";
import { LayoutUnchangingProvider } from "../components/Layout/layout-providers";
import { isConnected } from "../state/connections";
import { Entry } from "../components/Entry/entry.component";
import { scrollIntoView } from "../components/scroll-into-view";
import { updateCache } from "../components/UploadOfflineItems/update-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../state/resolvers/update-get-experiences-mini-query";
import {
  wipeReferencesFromCache,
  removeQueriesAndMutationsFromCache,
} from "../state/resolvers/delete-references-from-cache";
import { deleteExperiencesIdsFromOfflineItemsInCache } from "../apollo-cache/delete-experiences-ids-from-offline-items";
import { EbnisAppProvider } from "../context";
import {
  useUploadOfflineExperiencesMutation,
  useUploadOfflineItemsMutation,
  useUploadOfflineEntriesMutation,
} from "../components/UploadOfflineItems/upload-offline.injectables";
import { act } from "react-dom/test-utils";
import {
  makeExperienceComponentId,
  createdOnlineExperiencesContainerId,
  createdOfflineExperiencesContainerId,
  makeExperienceUploadStatusClassNames,
  makeUploadStatusIconId,
  makeEntryId,
  makeExperienceErrorId,
  uploadBtnDomId,
  offlineExperiencesTabMenuDomId,
} from "../components/UploadOfflineItems/upload-offline.dom";

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
jest.mock("../state/resolvers/update-get-experiences-mini-query");
jest.mock("../state/resolvers/delete-references-from-cache");
jest.mock("../apollo-cache/delete-experiences-ids-from-offline-items.ts");

const mockUseState = useState;
const mockUseEffect = useEffect;
let mockGetAllUnsavedQueryReturnValue: null | GetOfflineItemsQueryResult;
jest.mock(
  "../components/UploadOfflineItems/upload-offline.injectables",
  () => ({
    useGetAllUnsavedQuery: () => {
      const [result, setResult] = mockUseState<GetOfflineItemsQueryResult>({
        loading: true,
      } as GetOfflineItemsQueryResult);

      mockUseEffect(() => {
        const r = mockGetAllUnsavedQueryReturnValue as GetOfflineItemsQueryResult;
        setResult(r);
      }, []);

      return result;
    },

    useUploadOfflineExperiencesMutation: jest.fn(),
    useUploadOfflineItemsMutation: jest.fn(),
    useUploadOfflineEntriesMutation: jest.fn(),
    addUploadOfflineItemsResolvers: jest.fn(),
  }),
);

const mockIsConnected = isConnected as jest.Mock;
const mockEntry = Entry as jest.Mock;
const mockScrollIntoView = scrollIntoView as jest.Mock;
const mockUpdateCache = updateCache as jest.Mock;
const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;
const mockWipeReferencesFromCache = wipeReferencesFromCache as jest.Mock;
const mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache = deleteExperiencesIdsFromOfflineItemsInCache as jest.Mock;
const mockUseUploadUnsavedExperiencesMutation = useUploadOfflineExperiencesMutation as jest.Mock;
const mockUseUploadAllUnsavedsMutation = useUploadOfflineItemsMutation as jest.Mock;
const mockUseUploadOnlineExperiencesOfflineEntriesMutation = useUploadOfflineEntriesMutation as jest.Mock;
const mockRemoveQueriesAndMutationsFromCache = removeQueriesAndMutationsFromCache as jest.Mock;

////////////////////////// END MOCK ////////////////////////////

beforeEach(() => {
  jest.useFakeTimers();
  mockWipeReferencesFromCache.mockReset();
  mockUpdateCache.mockReset();
  mockScrollIntoView.mockReset();
  mockIsConnected.mockReset();
  mockEntry.mockClear();
  mockGetAllUnsavedQueryReturnValue = null;
  mockUseUploadOnlineExperiencesOfflineEntriesMutation.mockReset();
  mockUseUploadUnsavedExperiencesMutation.mockReset();
  mockUseUploadAllUnsavedsMutation.mockReset();
  mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache.mockReset();
  mockReplaceExperiencesInGetExperiencesMiniQuery.mockReset();
  mockRemoveQueriesAndMutationsFromCache.mockReset();
});

afterEach(() => {
  jest.clearAllTimers();
  cleanup();
});

const timeStamps = { insertedAt: "a", updatedAt: "a" };

describe("components", () => {
  it("redirects to 404 when not connected", async () => {
    const { ui, mockNavigate } = makeComp({
      isConnected: false,
    });

    act(() => {
      render(ui);
    });

    expect(mockNavigate).toHaveBeenCalled();
    expect(document.getElementById("a-lo")).toBeNull();
  });

  it("renders loading indicator", () => {
    expect(mockGetAllUnsavedQueryReturnValue).toBeNull();

    /**
     * Given we are loading data
     */
    const { ui } = makeComp({
      getOfflineItems: {} as any,
    });

    /**
     * While component is rendering
     */
    act(() => {
      render(ui);

      /**
       * Then we should see loading indicator
       */
      expect(document.getElementById(mockLoadingId)).not.toBeNull();
    });
  });

  it("redirects to 404 when there are no offline data", async () => {
    expect(mockGetAllUnsavedQueryReturnValue).toBeNull();
    const { ui, mockNavigate } = makeComp({
      getOfflineItems: {
        completelyOfflineCount: 0,
        partlyOfflineCount: 0,
      } as GetOfflineItemsSummary,
    });

    render(ui);

    expect(mockNavigate).toHaveBeenCalled();
    expect(document.getElementById(mockLoadingId)).toBeNull();
  });

  it("shows only partly offline item with no online entries and uploads all offline entries successfully", async () => {
    expect(mockGetAllUnsavedQueryReturnValue).toBeNull();

    const { id: entryId, ...entry } = {
      ...makeEntryNode(makeOfflineId("1")),
      clientId: "a",
      experienceId: "1",
    };

    const unsavedEntry = {
      ...entry,
      id: entryId,
    } as ExperienceFragment_entries_edges_node;

    const savedEntry = {
      id: "2",
    } as ExperienceFragment_entries_edges_node;

    const experience = {
      id: "1",
      title: "a",

      entries: {
        edges: [
          {
            node: unsavedEntry,
          },

          {
            node: savedEntry,
          },
        ],
      },
    } as ExperienceFragment;

    const {
      ui,
      mockUploadOfflineExperiences,
      mockUploadOnlineExperiencesOfflineEntries,
      mockUploadAllUnsaveds,
    } = makeComp({
      getOfflineItems: {
        partialOnlineMap: {
          "1": {
            experience,
            offlineEntries: [unsavedEntry],
            onlineEntries: [savedEntry],
          },
        } as ExperiencesIdsToObjectMap,

        partlyOfflineCount: 1,
      } as GetOfflineItemsSummary,
    });

    mockUploadOnlineExperiencesOfflineEntries.mockResolvedValue({
      data: {
        createEntries: [
          {
            experienceId: "1",
            entries: [{}],
          },
        ],
      },
    });

    const domOfflineTitle1Id = makeExperienceComponentId(
      1,
      CreationMode.online,
    );

    let unmount: any = null;

    act(() => {
      const args = render(ui);
      unmount = args.unmount;
    });

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

    const domOnlineTitle1Id = makeExperienceComponentId(1, CreationMode.online);

    const $elm = await waitForElement(() => {
      return document.getElementById(domOnlineTitle1Id) as HTMLElement;
    });

    expect(mockUploadOnlineExperiencesOfflineEntries).toHaveBeenCalled();

    expect($elm.classList).toContain(
      makeExperienceUploadStatusClassNames(true)[1],
    );

    const uploadedEntry = ((mockUploadOnlineExperiencesOfflineEntries.mock
      .calls[0][0] as any).variables as CreateOnlineEntryMutationVariables)
      .input[0];

    expect(uploadedEntry).toEqual(entry);

    expect(mockUploadOfflineExperiences).not.toHaveBeenCalled();
    expect(mockUploadAllUnsaveds).not.toHaveBeenCalled();

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

  it("shows only completely offline items and uploading all succeeds", async () => {
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

    const {
      ui,
      mockUploadOfflineExperiences,
      mockUploadOnlineExperiencesOfflineEntries,
      mockUploadAllUnsaveds,
    } = makeComp({
      getOfflineItems: {
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

    let unmount: any;

    act(() => {
      const args = render(ui);
      unmount = args.unmount;
      expect(document.getElementById(mockLoadingId)).not.toBeNull();
    });

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

    const domTitle1Id = makeExperienceComponentId(1, CreationMode.offline);

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
      definitionToUnsavedData as any,
    );

    expect(otherExperienceFields).toEqual(experience);

    expect(uploadedEntries[0]).toEqual(entry);

    expect(mockUploadOnlineExperiencesOfflineEntries).not.toHaveBeenCalled();
    expect(mockUploadAllUnsaveds).not.toHaveBeenCalled();

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

    const {
      ui,
      mockUploadOfflineExperiences,
      mockUploadOnlineExperiencesOfflineEntries,
      mockUploadAllUnsaveds,
    } = makeComp({
      getOfflineItems: {
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

    mockUploadAllUnsaveds.mockResolvedValue({
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

    act(() => {
      render(ui);
    });

    /**
     * Then partly saved experiences should be visible
     */

    expect(
      document.getElementById(createdOnlineExperiencesContainerId),
    ).not.toBeNull();

    /**
     * And never saved experiences should not be visible
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
     * When we click on never saved tab menu
     */

    const $neverSavedTabMenu = document.getElementById(
      offlineExperiencesTabMenuDomId,
    ) as HTMLElement;

    $neverSavedTabMenu.click();

    jest.runAllTimers();

    /**
     * Then never saved experiences should be visible
     */

    expect(
      document.getElementById(createdOfflineExperiencesContainerId),
    ).not.toBeNull();

    /**
     * And partly saved experience should not be visible
     */

    expect(
      document.getElementById(createdOnlineExperiencesContainerId),
    ).toBeNull();

    /**
     * And should not contain any error UI
     */

    const domTitle1Id = makeExperienceComponentId(1, CreationMode.offline);

    expect(
      (document.getElementById(domTitle1Id) as any).classList,
    ).not.toContain("error");

    /**
     * When we click on partly saved tab menu
     */

    const $partlySavedTabMenu = document.getElementById(
      "upload-unsaved-tab-menu-partly-saved",
    ) as any;

    fireEvent.click($partlySavedTabMenu);

    jest.runAllTimers();

    /**
     * Then partly saved experiences should become visible
     */

    expect(
      document.getElementById(createdOnlineExperiencesContainerId),
    ).not.toBeNull();

    /**
     * And never saved experiences should not be visible
     */

    expect(
      document.getElementById(createdOfflineExperiencesContainerId),
    ).toBeNull();

    const domTitle2Id = makeExperienceComponentId(2, CreationMode.online);

    expect(
      (document.getElementById(domTitle2Id) as any).classList,
    ).not.toContain("error");

    const domEntry = document.getElementById(
      makeEntryId(entryId),
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

    expect(mockUploadAllUnsaveds).toHaveBeenCalled();

    expect(mockUploadOfflineExperiences).not.toHaveBeenCalled();
    expect(mockUploadOnlineExperiencesOfflineEntries).not.toHaveBeenCalled();

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
    const { ui, mockUploadAllUnsaveds } = makeComp({
      getOfflineItems: {
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

    mockUploadAllUnsaveds.mockRejectedValue(new Error("a"));

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

  it("deletes never saved", async () => {
    const { ui, mockNavigate, mockLayoutDispatch } = makeComp({
      getOfflineItems: {
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
      jest.runAllTimers();
      expect(document.getElementById("experience-1-delete-button")).toBeNull();
    });

    expect(
      mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
    ).toEqual({ "1": null });

    expect(mockWipeReferencesFromCache).toHaveBeenCalledWith({}, ["1", "10"]);

    expect(
      mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache,
    ).toHaveBeenCalledWith({}, ["1"]);

    expect(mockNavigate).toHaveBeenCalledWith(EXPERIENCES_URL);

    expect(mockLayoutDispatch).toHaveBeenCalled();
  });

  it("deletes partly saved but not never saved", async () => {
    const { ui, mockNavigate } = makeComp({
      getOfflineItems: {
        completelyOfflineCount: 1,

        completelyOfflineMap: {
          "2": {
            experience: {
              id: "2",
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

        partlyOfflineCount: 1,

        partialOnlineMap: {
          "1": {
            experience: {
              id: "1",
            } as ExperienceFragment,
            offlineEntries: [],
            onlineEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetOfflineItemsSummary,
    });

    mockReplaceExperiencesInGetExperiencesMiniQuery.mockResolvedValue({});

    act(() => {
      render(ui);
    });

    expect(
      document.getElementById("upload-unsaved-tab-menu-partly-saved"),
    ).not.toBeNull();

    (document.getElementById("experience-1-delete-button") as any).click();

    await wait(() => {
      jest.runAllTimers();
      expect(document.getElementById("experience-1-delete-button")).toBeNull();
    });

    expect(
      document.getElementById("upload-unsaved-tab-menu-partly-saved"),
    ).toBeNull();

    expect(mockNavigate).not.toHaveBeenCalled();

    expect(
      mockReplaceExperiencesInGetExperiencesMiniQuery.mock.calls[0][1],
    ).toEqual({ "1": null });

    expect(mockWipeReferencesFromCache.mock.calls[0][1]).toEqual(["1"]);

    expect(
      mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache.mock
        .calls[0][1],
    ).toEqual(["1"]);
  });

  test("experience now online but entry still offline", async done => {
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

    const { ui, mockUploadOfflineExperiences } = makeComp({
      getOfflineItems: {
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

    act(() => {
      render(ui);
      expect(document.getElementById(mockLoadingId)).not.toBeNull();
    });

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

    done();
  });
});

describe("non components", () => {
  test("onUploadResultsReceived/2 does nothing if upload mutation does not exist", () => {
    expect(onUploadResultsReceived({} as StateMachine, undefined)).toEqual({});
  });

  test("onUploadResultsReceived/2 initializes experience uploaded state", () => {
    const nextState = onUploadResultsReceived(
      {
        states: {
          upload: {},
        },
      } as StateMachine,
      {} as UploadOfflineItemsMutation,
    );

    expect(nextState).toEqual({
      states: {
        upload: {
          value: "uploaded",
          uploaded: {
            parallel: true,
            states: {
              experiences: {
                value: "initial",
                context: {
                  anySuccess: false,
                },
              },
            },
          },
        },
      },
    } as StateMachine);
  });

  test("onUploadResultsReceived/2 handles results with undefined elements", () => {
    const state = {
      states: {
        upload: {},
      },

      completelyOfflineMap: {
        "1": {
          experience: {
            id: "1",
            clientId: "1",
          } as ExperienceFragment,

          offlineEntries: [
            {
              id: "1",
              clientId: "1",
              dataObjects: [
                {
                  definitionId: "1",
                },
              ],
            },

            {
              id: "2",
              clientId: "2",
              dataObjects: [
                {
                  // Notice definitionId (2), different from above (1). Server
                  // will return dataDefinition.clientId of 1 and so only
                  // the entry above will have its definitionId replaced
                  // because 2 will not match
                  definitionId: "2",
                },
              ],
            },
          ],
        } as ExperienceObjectMap,
      } as ExperiencesIdsToObjectMap,

      partialOnlineMap: {
        "1": {
          offlineEntries: [
            {
              id: "1",
              clientId: "1",
            },
          ],
        } as ExperienceObjectMap,
      } as ExperiencesIdsToObjectMap,
    } as StateMachine;

    const payload = {
      saveOfflineExperiences: [
        null,

        {
          experience: {
            id: "a",
            clientId: "1",
            dataDefinitions: [
              {
                id: "a",
                clientId: "1",
              },
            ],

            entries: {},
          },
        },
      ],

      createEntries: [
        null,

        {
          errors: [],

          entries: [
            {
              id: "a",
              clientId: "1",
            },
          ],

          experienceId: "1",
        },
      ],
    } as UploadOfflineItemsMutation;

    const nextState = onUploadResultsReceived(state, payload);

    expect(nextState).toEqual({
      states: {
        upload: {
          value: "uploaded",
          uploaded: {
            parallel: true,
            states: {
              experiences: {
                context: {
                  anySuccess: true,
                },
                partial: {
                  states: {
                    offline: {
                      value: "partialSuccess",
                    },
                    saved: {
                      value: "partialSuccess",
                    },
                  },
                },
                value: "partial",
              },
            },
          },
        },
      },
      completelyOfflineMap: {
        "1": {
          experience: {
            id: "1",
            clientId: "1",
          },
          offlineEntries: [
            {
              id: "1",
              clientId: "1",
              dataObjects: [
                {
                  definitionId: "a",
                },
              ],
            },
            {
              id: "2",
              clientId: "2",
              dataObjects: [
                {
                  definitionId: "2",
                },
              ],
            },
          ],
          newlySavedExperience: {
            id: "a",
            clientId: "1",
            dataDefinitions: [
              {
                id: "a",
                clientId: "1",
              },
            ],
            entries: {},
          },
          didUploadSucceed: true,
        } as ExperienceObjectMap,
      } as ExperiencesIdsToObjectMap,

      partialOnlineMap: {
        "1": {
          offlineEntries: [
            {
              id: "a",
              clientId: "1",
            },
          ],
          newlyOnlineEntries: [
            {
              id: "a",
              clientId: "1",
            },
          ],
          didUploadSucceed: false,
          entriesErrors: {},
        } as ExperienceObjectMap,
      } as ExperiencesIdsToObjectMap,
    } as StateMachine);
  });
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const UploadUnsavedP = UploadOfflineItems as ComponentType<Partial<Props>>;

const defaultArgs: Args = {
  props: {},
  isConnected: true,
};

function makeComp(args: Args = {}) {
  args = { ...defaultArgs, ...args };
  const { props, isConnected, getOfflineItems } = args;

  mockGetAllUnsavedQueryReturnValue = (getOfflineItems
    ? {
        data: {
          getOfflineItems,
        },
      }
    : {}) as GetOfflineItemsQueryResult;

  mockIsConnected.mockReturnValue(isConnected);

  const mockUploadOfflineExperiences = jest.fn();

  mockUseUploadUnsavedExperiencesMutation.mockReturnValue([
    mockUploadOfflineExperiences,
  ]);

  const mockUploadOnlineExperiencesOfflineEntries = jest.fn();

  mockUseUploadOnlineExperiencesOfflineEntriesMutation.mockReturnValue([
    mockUploadOnlineExperiencesOfflineEntries,
  ]);

  const mockUploadAllUnsaveds = jest.fn();
  mockUseUploadAllUnsavedsMutation.mockReturnValue([mockUploadAllUnsaveds]);

  const mockLayoutDispatch = jest.fn();

  const { Ui, ...routerProps } = renderWithRouter(UploadUnsavedP);

  return {
    ui: (
      <EbnisAppProvider
        value={
          {
            client: {},
            cache: {},
            persistor: {
              persist: jest.fn(),
            },
          } as any
        }
      >
        <LayoutUnchangingProvider
          value={{
            layoutDispatch: mockLayoutDispatch,
          }}
        >
          <Ui {...props} />
        </LayoutUnchangingProvider>
      </EbnisAppProvider>
    ),

    mockUploadOfflineExperiences,
    mockUploadOnlineExperiencesOfflineEntries,
    mockUploadAllUnsaveds,
    mockLayoutDispatch,
    ...routerProps,
  };
}

interface Args {
  props?: Partial<Props>;
  isConnected?: boolean;
  getOfflineItems?: GetOfflineItemsSummary;
}
