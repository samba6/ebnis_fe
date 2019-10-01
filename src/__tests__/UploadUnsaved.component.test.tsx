/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType, useState, useEffect } from "react";
import {
  render,
  fireEvent,
  wait,
  waitForElement,
  cleanup,
} from "@testing-library/react";
import { UploadUnsaved } from "../components/UploadUnsaved/upload-unsaved.component";
import {
  Props,
  definitionToUnsavedData,
  ExperiencesIdsToObjectMap,
  onUploadResultsReceived,
  StateMachine,
  ExperienceObjectMap,
} from "../components/UploadUnsaved/upload-unsaved.utils";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges_node_dataObjects,
  ExperienceFragment_dataDefinitions,
} from "../graphql/apollo-types/ExperienceFragment";
import { makeUnsavedId } from "../constants";
import {
  renderWithRouter,
  makeDataDefinitions,
  makeEntryNode,
  closeMessage,
} from "./test_utils";
import { CreateEntryMutationVariables } from "../graphql/apollo-types/CreateEntryMutation";
import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutation_createEntries,
  UploadAllUnsavedsMutation_saveOfflineExperiences,
} from "../graphql/apollo-types/UploadAllUnsavedsMutation";
import { Props as EntryProps } from "../components/Entry/entry.utils";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import { EXPERIENCES_URL } from "../routes";
import {
  GetUnsavedSummary,
  GetAllUnsavedQueryResult,
} from "../state/unsaved-resolvers";
import { LayoutUnchangingProvider } from "../components/Layout/layout-providers";
import { isConnected } from "../state/connections";
import { Entry } from "../components/Entry/entry.component";
import { scrollIntoView } from "../components/scroll-into-view";
import { updateCache } from "../components/UploadUnsaved/update-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../state/resolvers/update-get-experiences-mini-query";
import {
  deleteIdsFromCache,
  removeQueriesAndMutationsFromCache,
} from "../state/resolvers/delete-references-from-cache";
import { deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache } from "../state/resolvers/update-saved-and-unsaved-experiences-in-cache";
import { EbnisAppProvider } from "../context";
import {
  useUploadUnsavedExperiencesMutation,
  useUploadAllUnsavedsMutation,
  useUploadSavedExperiencesEntriesMutation,
} from "../components/UploadUnsaved/upload-unsaved.injectables";
import { act } from "react-dom/test-utils";

const mockLoadingId = "a-lo";
jest.mock("../components/Loading/loading", () => ({
  Loading: () => <div id={mockLoadingId} />,
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
jest.mock("../components/UploadUnsaved/update-cache");
jest.mock("../state/resolvers/update-get-experiences-mini-query");
jest.mock("../state/resolvers/delete-references-from-cache");
jest.mock("../state/resolvers/update-saved-and-unsaved-experiences-in-cache");

const mockUseState = useState;
const mockUseEffect = useEffect;
let mockGetAllUnsavedQueryReturnValue: null | GetAllUnsavedQueryResult;
jest.mock("../components/UploadUnsaved/upload-unsaved.injectables", () => ({
  useGetAllUnsavedQuery: () => {
    const [result, setResult] = mockUseState<GetAllUnsavedQueryResult>({
      loading: true,
    } as GetAllUnsavedQueryResult);

    mockUseEffect(() => {
      const r = mockGetAllUnsavedQueryReturnValue as GetAllUnsavedQueryResult;
      setResult(r);
    }, []);

    return result;
  },

  useUploadUnsavedExperiencesMutation: jest.fn(),
  useUploadAllUnsavedsMutation: jest.fn(),
  useUploadSavedExperiencesEntriesMutation: jest.fn(),
  addUploadUnsavedResolvers: jest.fn(),
}));

const mockIsConnected = isConnected as jest.Mock;
const mockEntry = Entry as jest.Mock;
const mockScrollIntoView = scrollIntoView as jest.Mock;
const mockUpdateCache = updateCache as jest.Mock;
const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;
const mockDeleteIdsFromCache = deleteIdsFromCache as jest.Mock;
const mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache = deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache as jest.Mock;
const mockUseUploadUnsavedExperiencesMutation = useUploadUnsavedExperiencesMutation as jest.Mock;
const mockUseUploadAllUnsavedsMutation = useUploadAllUnsavedsMutation as jest.Mock;
const mockUseUploadSavedExperiencesEntriesMutation = useUploadSavedExperiencesEntriesMutation as jest.Mock;
const mockRemoveQueriesAndMutationsFromCache = removeQueriesAndMutationsFromCache as jest.Mock;

////////////////////////// END MOCK ////////////////////////////

beforeEach(() => {
  jest.useFakeTimers();
  mockDeleteIdsFromCache.mockReset();
  mockUpdateCache.mockReset();
  mockScrollIntoView.mockReset();
  mockIsConnected.mockReset();
  mockEntry.mockClear();
  mockGetAllUnsavedQueryReturnValue = null;
  mockUseUploadSavedExperiencesEntriesMutation.mockReset();
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
      getAllUnsaved: {} as any,
    });

    /**
     * While component is rendering
     */
    act(() => {
      render(ui);

      /**
       * Then we should see loading indicator
       */
      expect(document.getElementById("a-lo")).not.toBeNull();
    });
  });

  it("redirects to 404 when there are no unsaved data", async () => {
    expect(mockGetAllUnsavedQueryReturnValue).toBeNull();
    const { ui, mockNavigate } = makeComp({
      getAllUnsaved: {
        neverSavedCount: 0,
        partlySavedCount: 0,
      } as GetUnsavedSummary,
    });

    render(ui);

    expect(mockNavigate).toHaveBeenCalled();
    expect(document.getElementById("a-lo")).toBeNull();
  });

  it("shows only partly saved with no saved entries and uploads all unsaved entries successfully", async () => {
    expect(mockGetAllUnsavedQueryReturnValue).toBeNull();

    const { id: entryId, ...entry } = {
      ...makeEntryNode(makeUnsavedId("1")),
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
      mockUploadUnsavedExperiences,
      mockUploadSavedExperiencesEntries,
      mockUploadAllUnsaveds,
    } = makeComp({
      getAllUnsaved: {
        partlySavedMap: {
          "1": {
            experience,
            unsavedEntries: [unsavedEntry],
            savedEntries: [savedEntry],
          },
        } as ExperiencesIdsToObjectMap,

        partlySavedCount: 1,
      } as GetUnsavedSummary,
    });

    mockUploadSavedExperiencesEntries.mockResolvedValue({
      data: {
        createEntries: [
          {
            experienceId: "1",
            entries: [{}],
          },
        ],
      },
    });

    let unmount: any = null;

    act(() => {
      const args = render(ui);
      unmount = args.unmount;
    });

    expect(
      document.getElementById("upload-unsaved-tab-menu-partly-saved"),
    ).not.toBeNull();

    expect(
      document.getElementById("upload-unsaved-container-never-saved"),
    ).toBeNull();

    expect(
      document.getElementById("upload-unsaved-tab-menu-never-saved"),
    ).toBeNull();

    expect(
      (document.getElementById(
        "upload-unsaved-saved-experience-1-title",
      ) as any).classList,
    ).not.toContain("experience-title--success");

    expect(
      document.getElementById("upload-triggered-icon-success-1"),
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
      document.getElementById("upload-unsaved-container-partly-saved"),
    ).not.toBeNull();

    fireEvent.click(document.getElementById(
      "upload-unsaved-upload-btn",
    ) as any);

    const $elm = await waitForElement(() => {
      return document.getElementById(
        "upload-unsaved-saved-experience-1-title",
      ) as any;
    });

    expect(mockUploadSavedExperiencesEntries).toHaveBeenCalled();

    expect($elm.classList).toContain("experience-title--success");

    const uploadedEntry = ((mockUploadSavedExperiencesEntries.mock
      .calls[0][0] as any).variables as CreateEntryMutationVariables).input[0];

    expect(uploadedEntry).toEqual(entry);

    expect(mockUploadUnsavedExperiences).not.toHaveBeenCalled();
    expect(mockUploadAllUnsaveds).not.toHaveBeenCalled();

    expect(document.getElementById("upload-unsaved-upload-btn")).toBeNull();

    expect(
      document.getElementById("upload-triggered-icon-success-1"),
    ).not.toBeNull();

    expect(
      document.getElementById("upload-triggered-success-icon-partly-saved"),
    ).not.toBeNull();

    expect(mockUpdateCache).toHaveBeenCalled();
    unmount();
    expect(mockRemoveQueriesAndMutationsFromCache).toHaveBeenCalled();
  });

  it("shows only never-saved and uploading all succeeds", async () => {
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
      mockUploadUnsavedExperiences,
      mockUploadSavedExperiencesEntries,
      mockUploadAllUnsaveds,
    } = makeComp({
      getAllUnsaved: {
        neverSavedCount: 1,

        neverSavedMap: {
          "1": {
            experience: unsavedExperience,
            unsavedEntries: [unsavedEntry],
            savedEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetUnsavedSummary,
    });

    mockUploadUnsavedExperiences.mockResolvedValue({
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
      document.getElementById("upload-unsaved-container-partly-saved"),
    ).toBeNull();

    expect(
      document.getElementById("upload-unsaved-tab-menu-partly-saved"),
    ).toBeNull();

    expect(
      document.getElementById("upload-unsaved-container-never-saved"),
    ).not.toBeNull();

    expect(
      document.getElementById("upload-unsaved-tab-menu-never-saved"),
    ).not.toBeNull();

    expect(
      document.getElementById("uploaded-success-tab-icon-never-saved"),
    ).toBeNull();

    expect(
      (document.getElementById(
        "upload-unsaved-unsaved-experience-1-title",
      ) as any).classList,
    ).not.toContain("experience-title--success");

    expect(document.getElementById("upload-triggered-icon-error-1")).toBeNull();

    expect(
      document.getElementById("upload-triggered-icon-success-1"),
    ).toBeNull();

    const tabsMenuClassList = (document.getElementById(
      "upload-unsaved-tabs-menu",
    ) as any).classList;

    expect(tabsMenuClassList).toContain("one");
    expect(tabsMenuClassList).not.toContain("two");

    /**
     * When we click on never saved tab menu
     */

    (document.getElementById(
      "upload-unsaved-tab-menu-never-saved",
    ) as any).click();

    jest.runAllTimers();

    /**
     * Then never saved experience should continue to be visible
     * (there is only one tab)
     */

    expect(
      document.getElementById("upload-unsaved-container-never-saved"),
    ).not.toBeNull();

    fireEvent.click(document.getElementById(
      "upload-unsaved-upload-btn",
    ) as any);

    const $successIcon = await waitForElement(() =>
      document.getElementById("uploaded-success-tab-icon-never-saved"),
    );

    expect($successIcon).not.toBeNull();

    const {
      entries: uploadedEntries,

      ...otherExperienceFields
    } = (mockUploadUnsavedExperiences.mock
      .calls[0][0] as any).variables.input[0];

    experience.dataDefinitions = experience.dataDefinitions.map(
      definitionToUnsavedData as any,
    );

    expect(otherExperienceFields).toEqual(experience);

    expect(uploadedEntries[0]).toEqual(entry);

    expect(mockUploadSavedExperiencesEntries).not.toHaveBeenCalled();
    expect(mockUploadAllUnsaveds).not.toHaveBeenCalled();

    expect(document.getElementById("upload-unsaved-upload-btn")).toBeNull();

    expect(
      (document.getElementById(
        "upload-unsaved-unsaved-experience-1-title",
      ) as any).classList,
    ).toContain("experience-title--success");

    expect(
      document.getElementById("upload-triggered-icon-success-1"),
    ).not.toBeNull();

    expect(mockUpdateCache).toHaveBeenCalled();
    unmount();
    expect(mockRemoveQueriesAndMutationsFromCache).toHaveBeenCalled();
  });

  it("toggles partly and never saved, uploads but returns errors for all never saved", async () => {
    const entryId = makeUnsavedId("1");

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
      mockUploadUnsavedExperiences,
      mockUploadSavedExperiencesEntries,
      mockUploadAllUnsaveds,
    } = makeComp({
      getAllUnsaved: {
        neverSavedCount: 1,

        neverSavedMap: {
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

            unsavedEntries: [unsavedExperienceEntry],

            savedEntries: [],
          },
        } as ExperiencesIdsToObjectMap,

        partlySavedCount: 1,

        partlySavedMap: {
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

            unsavedEntries: [savedExperienceEntry],

            savedEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetUnsavedSummary,
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
        ] as UploadAllUnsavedsMutation_createEntries[],

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
        ] as UploadAllUnsavedsMutation_saveOfflineExperiences[],
      } as UploadAllUnsavedsMutation,
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
      document.getElementById("upload-unsaved-container-partly-saved"),
    ).not.toBeNull();

    /**
     * And never saved experiences should not be visible
     */

    expect(
      document.getElementById("upload-unsaved-container-never-saved"),
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
      "upload-unsaved-tab-menu-never-saved",
    ) as any;

    $neverSavedTabMenu.click();

    jest.runAllTimers();

    /**
     * Then never saved experiences should be visible
     */

    expect(
      document.getElementById("upload-unsaved-container-never-saved"),
    ).not.toBeNull();

    /**
     * And partly saved experience should not be visible
     */

    expect(
      document.getElementById("upload-unsaved-container-partly-saved"),
    ).toBeNull();

    /**
     * And should not contain any error UI
     */

    expect(
      (document.getElementById(
        "upload-unsaved-unsaved-experience-1-title",
      ) as any).classList,
    ).not.toContain("experience-title--error");

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
      document.getElementById("upload-unsaved-container-partly-saved"),
    ).not.toBeNull();

    /**
     * And never saved experiences should not be visible
     */

    expect(
      document.getElementById("upload-unsaved-container-never-saved"),
    ).toBeNull();

    expect(
      (document.getElementById(
        "upload-unsaved-saved-experience-2-title",
      ) as any).classList,
    ).not.toContain("experience-title--error");

    const $entry = document.getElementById(
      `upload-unsaved-entry-${entryId}`,
    ) as any;

    expect($entry.classList).not.toContain("entry--error");

    expect(document.getElementById("upload-triggered-icon-error-1")).toBeNull();

    expect(document.getElementById("upload-triggered-icon-error-2")).toBeNull();

    expect(
      document.getElementById("upload-triggered-error-icon-partly-saved"),
    ).toBeNull();

    expect(
      document.getElementById("uploaded-error-tab-icon-never-saved"),
    ).toBeNull();

    expect(document.getElementById("unsaved-experience-errors-1")).toBeNull();

    fireEvent.click(document.getElementById(
      "upload-unsaved-upload-btn",
    ) as any);

    const $error = await waitForElement(() =>
      document.getElementById("upload-triggered-icon-error-2"),
    );

    expect($error).not.toBeNull();

    expect(mockUploadAllUnsaveds).toHaveBeenCalled();

    expect(mockUploadUnsavedExperiences).not.toHaveBeenCalled();
    expect(mockUploadSavedExperiencesEntries).not.toHaveBeenCalled();

    expect(
      document.getElementById("upload-triggered-error-icon-partly-saved"),
    ).not.toBeNull();

    // we are currently showing saved experiences - we confirm it has error class
    expect(
      document.getElementById("upload-unsaved-container-partly-saved"),
    ).not.toBeNull();

    expect(
      (document.getElementById(
        "upload-unsaved-saved-experience-2-title",
      ) as any).classList,
    ).toContain("experience-title--error");

    // we also check to see that correct class has been applied to the entry
    expect($entry.classList).toContain("entry--error");

    // we toggle to show unsaved experiences and confirm they also have error
    // class
    fireEvent.click($neverSavedTabMenu);
    jest.runAllTimers();

    expect(
      document.getElementById("upload-unsaved-container-never-saved"),
    ).not.toBeNull();

    expect(
      (document.getElementById(
        "upload-unsaved-unsaved-experience-1-title",
      ) as any).classList,
    ).toContain("experience-title--error");

    expect(
      document.getElementById("upload-triggered-icon-error-1"),
    ).not.toBeNull();

    expect(
      document.getElementById("uploaded-error-tab-icon-never-saved"),
    ).not.toBeNull();

    expect(document.getElementById("upload-unsaved-upload-btn")).not.toBeNull();

    expect(
      document.getElementById("unsaved-experience-errors-1"),
    ).not.toBeNull();

    expect(mockUpdateCache).not.toHaveBeenCalled();
  });

  it("shows apollo errors", async () => {
    const { ui, mockUploadAllUnsaveds } = makeComp({
      getAllUnsaved: {
        neverSavedCount: 1,

        neverSavedMap: {
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

            unsavedEntries: [
              {
                id: "1",
                clientId: "1",
                dataObjects: [] as ExperienceFragment_entries_edges_node_dataObjects[],
              } as ExperienceFragment_entries_edges_node,
            ],

            savedEntries: [],
          },
        } as ExperiencesIdsToObjectMap,

        partlySavedCount: 1,

        partlySavedMap: {
          "2": {
            experience: {
              id: "2",
              title: "b",
              dataDefinitions: [] as ExperienceFragment_dataDefinitions[],

              entries: {
                edges: [
                  {
                    node: {
                      id: makeUnsavedId("1"),
                      clientId: makeUnsavedId("1"),
                    },
                  },
                ],
              },
            } as ExperienceFragment,

            unsavedEntries: [
              {
                id: makeUnsavedId("1"),
                clientId: makeUnsavedId("1"),
                dataObjects: [] as ExperienceFragment_entries_edges_node_dataObjects[],
              } as ExperienceFragment_entries_edges_node,
            ],
            savedEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetUnsavedSummary,
    });

    mockUploadAllUnsaveds.mockRejectedValue(new Error("a"));

    render(ui);

    expect(document.getElementById("upload-unsaved-server-error")).toBeNull();

    fireEvent.click(document.getElementById(
      "upload-unsaved-upload-btn",
    ) as any);

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
      getAllUnsaved: {
        neverSavedCount: 1,

        neverSavedMap: {
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

            unsavedEntries: [
              {
                id: "10",
                clientId: "10",
              } as ExperienceFragment_entries_edges_node,
            ],

            savedEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetUnsavedSummary,
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

    expect(mockDeleteIdsFromCache).toHaveBeenCalledWith({}, ["1", "10"]);

    expect(
      mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache,
    ).toHaveBeenCalledWith({}, ["1"]);

    expect(mockNavigate).toHaveBeenCalledWith(EXPERIENCES_URL);

    expect(mockLayoutDispatch).toHaveBeenCalled();
  });

  it("deletes partly saved but not never saved", async () => {
    const { ui, mockNavigate } = makeComp({
      getAllUnsaved: {
        neverSavedCount: 1,

        neverSavedMap: {
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

            unsavedEntries: [
              {
                id: "10",
                clientId: "10",
              } as ExperienceFragment_entries_edges_node,
            ],

            savedEntries: [],
          },
        } as ExperiencesIdsToObjectMap,

        partlySavedCount: 1,

        partlySavedMap: {
          "1": {
            experience: {
              id: "1",
            } as ExperienceFragment,
            unsavedEntries: [],
            savedEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetUnsavedSummary,
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

    expect(mockDeleteIdsFromCache.mock.calls[0][1]).toEqual(["1"]);

    expect(
      mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache.mock
        .calls[0][1],
    ).toEqual(["1"]);
  });

  test("experience saved but entry did not", async done => {
    const unsavedEntry = {
      id: "1",
      clientId: "1",
      dataObjects: [
        {
          definitionId: "f1",
          data: `{"decimal":1}`,
        },
      ],
      experienceId: "1",
      ...timeStamps,
    } as ExperienceFragment_entries_edges_node;

    const unsavedExperience = {
      title: "a",
      clientId: "1",
      id: "1",

      entries: {
        edges: [
          {
            node: unsavedEntry,
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

    const savedExperience = {
      title: "a",
      clientId: "1",
      // id will change on successful save
      id: "2",

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

    const { ui, mockUploadUnsavedExperiences } = makeComp({
      getAllUnsaved: {
        neverSavedCount: 1,

        neverSavedMap: {
          "1": {
            experience: unsavedExperience,
            unsavedEntries: [unsavedEntry],
            savedEntries: [],
          },
        } as ExperiencesIdsToObjectMap,
      } as GetUnsavedSummary,
    });

    mockUploadUnsavedExperiences.mockResolvedValue({
      data: {
        saveOfflineExperiences: [
          {
            experience: savedExperience,
            entriesErrors: [
              {
                experienceId: "2",
                clientId: "1",
                errors: {
                  experienceId: "err",
                },
              },
            ],
          } as UploadAllUnsavedsMutation_saveOfflineExperiences,
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

    expect(document.getElementById("upload-triggered-icon-error-2")).toBeNull();

    const $uploadBtn = await waitForElement(() => {
      return document.getElementById("upload-unsaved-upload-btn") as any;
    });

    fireEvent.click($uploadBtn);

    const $errorIcon = await waitForElement(() =>
      document.getElementById("upload-triggered-icon-error-2"),
    );

    expect($errorIcon).not.toBeNull();

    expect(document.getElementById("upload-unsaved-upload-btn")).not.toBeNull();

    expect(
      document.getElementById("upload-triggered-icon-success-1"),
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
      {} as UploadAllUnsavedsMutation,
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

      neverSavedMap: {
        "1": {
          experience: {
            id: "1",
            clientId: "1",
          } as ExperienceFragment,

          unsavedEntries: [
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

      partlySavedMap: {
        "1": {
          unsavedEntries: [
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
    } as UploadAllUnsavedsMutation;

    const nextState = onUploadResultsReceived(state, payload);
    // console.log(JSON.stringify(nextState, null, 2));

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
                    unsaved: {
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
      neverSavedMap: {
        "1": {
          experience: {
            id: "1",
            clientId: "1",
          },
          unsavedEntries: [
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

      partlySavedMap: {
        "1": {
          unsavedEntries: [
            {
              id: "a",
              clientId: "1",
            },
          ],
          newlySavedEntries: [
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

const UploadUnsavedP = UploadUnsaved as ComponentType<Partial<Props>>;

const defaultArgs: Args = {
  props: {},
  isConnected: true,
};

function makeComp(args: Args = {}) {
  args = { ...defaultArgs, ...args };
  const { props, isConnected, getAllUnsaved } = args;

  mockGetAllUnsavedQueryReturnValue = (getAllUnsaved
    ? {
        data: {
          getAllUnsaved,
        },
      }
    : {}) as GetAllUnsavedQueryResult;

  mockIsConnected.mockReturnValue(isConnected);

  const mockUploadUnsavedExperiences = jest.fn();

  mockUseUploadUnsavedExperiencesMutation.mockReturnValue([
    mockUploadUnsavedExperiences,
  ]);

  const mockUploadSavedExperiencesEntries = jest.fn();

  mockUseUploadSavedExperiencesEntriesMutation.mockReturnValue([
    mockUploadSavedExperiencesEntries,
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

    mockUploadUnsavedExperiences,
    mockUploadSavedExperiencesEntries,
    mockUploadAllUnsaveds,
    mockLayoutDispatch,
    ...routerProps,
  };
}

interface Args {
  props?: Partial<Props>;
  isConnected?: boolean;
  getAllUnsaved?: GetUnsavedSummary;
}
