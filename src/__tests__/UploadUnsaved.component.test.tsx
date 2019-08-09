/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait, waitForElement } from "react-testing-library";
import { UploadUnsaved } from "../components/UploadUnsaved/component";
import {
  Props,
  definitionToUnsavedData,
  ExperiencesIdsToObjectMap,
} from "../components/UploadUnsaved/utils";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
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
import { Props as EntryProps } from "../components/Entry/utils";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import { EXPERIENCES_URL } from "../routes";
import {
  GetAllUnSavedQueryData,
  GetUnsavedSummary,
} from "../state/unsaved-resolvers";
import { LayoutProvider } from "../components/Layout/layout-provider";

jest.mock("../components/Loading", () => ({
  Loading: () => <div id="a-lo" />,
}));

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: ({ children }: any) => {
    return <> {children} </>;
  },
}));

jest.mock("../state/connections");

jest.mock("../components/Entry/component", () => ({
  Entry: jest.fn((props: any) => {
    return <div className={props.className} id={props.id} />;
  }),
}));

jest.mock("../components/Experience/loadables", () => ({
  EditExperience: () => <div className="js-editor" />,

  EditEntry: () => <div id="entry-edit-modal" />,
}));

jest.mock("../components/scroll-into-view");
jest.mock("../components/UploadUnsaved/update-cache");
jest.mock("../state/resolvers/update-get-experiences-mini-query");
jest.mock("../state/resolvers/delete-references-from-cache");
jest.mock("../state/resolvers/update-saved-and-unsaved-experiences-in-cache");

////////////////////////// MOCK IMPORT ////////////////////////////

import { scrollIntoView } from "../components/scroll-into-view";
import { updateCache } from "../components/UploadUnsaved/update-cache";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../state/resolvers/update-get-experiences-mini-query";
import { deleteIdsFromCache } from "../state/resolvers/delete-references-from-cache";
import { deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache } from "../state/resolvers/update-saved-and-unsaved-experiences-in-cache";
import { isConnected } from "../state/connections";
import { Entry } from "../components/Entry/component";

////////////////////////// END MOCK IMPORT ////////////////////////////

const mockIsConnected = isConnected as jest.Mock;
const mockScrollIntoView = scrollIntoView as jest.Mock;
const mockUpdateCache = updateCache as jest.Mock;

const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;

const mockDeleteIdsFromCache = deleteIdsFromCache as jest.Mock;

const mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache = deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache as jest.Mock;

const mockEntry = Entry as jest.Mock;

const timeStamps = { insertedAt: "a", updatedAt: "a" };

it("redirects to 404 when not connected", async () => {
  const { ui, mockNavigate } = makeComp({
    isConnected: false,
  });

  render(ui);

  await wait(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/404");
  });

  expect(document.getElementById("a-lo")).toBeNull();
});

it("renders loading indicator", () => {
  const { ui } = makeComp({
    props: {
      getAllUnsavedProps: {
        loading: true,
      } as GetAllUnSavedQueryData,
    },
  });

  render(ui);

  expect(document.getElementById("a-lo")).not.toBeNull();
});

it("redirects to 404 when there are no unsaved data", async () => {
  const { ui, mockNavigate } = makeComp({
    props: {
      getAllUnsavedProps: {
        getAllUnsaved: {
          unsavedExperiencesLen: 0,
          savedExperiencesLen: 0,
        },
      } as GetAllUnSavedQueryData,
    },
  });

  render(ui);

  await wait(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/404");
  });

  expect(document.getElementById("a-lo")).toBeNull();
});

it("shows only saved experiences, does not show saved entries and uploads unsaved entries", async () => {
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
    props: {
      getAllUnsavedProps: {
        getAllUnsaved: {
          savedExperiencesMap: {
            "1": {
              experience,
              unsavedEntries: [unsavedEntry],
              savedEntries: [savedEntry],
            },
          } as ExperiencesIdsToObjectMap,

          savedExperiencesLen: 1,
        } as GetUnsavedSummary,
      } as GetAllUnSavedQueryData,
    },
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

  render(ui);

  expect(
    document.getElementById("upload-unsaved-saved-experiences-menu"),
  ).not.toBeNull();

  expect(
    document.getElementById("upload-unsaved-unsaved-experiences-container"),
  ).toBeNull();

  expect(
    document.getElementById("upload-unsaved-unsaved-experiences-menu"),
  ).toBeNull();

  expect(
    (document.getElementById("upload-unsaved-saved-experience-1-title") as any)
      .classList,
  ).not.toContain("experience-title--success");

  expect(document.getElementById("upload-triggered-icon-success-1")).toBeNull();

  expect(
    document.getElementById("upload-triggered-icon-success-saved-experiences"),
  ).toBeNull();

  const tabsMenuClassList = (document.getElementById(
    "upload-unsaved-tabs-menu",
  ) as any).classList;

  expect(tabsMenuClassList).toContain("one");
  expect(tabsMenuClassList).not.toContain("two");

  fireEvent.click(document.getElementById("upload-unsaved-upload-btn") as any);

  await wait(() => {
    expect(mockUploadSavedExperiencesEntries).toHaveBeenCalled();
  });

  const uploadedEntry = ((mockUploadSavedExperiencesEntries.mock
    .calls[0][0] as any).variables as CreateEntryMutationVariables).input[0];

  expect(uploadedEntry).toEqual(entry);

  expect(mockUploadUnsavedExperiences).not.toHaveBeenCalled();
  expect(mockUploadAllUnsaveds).not.toHaveBeenCalled();

  expect(
    (document.getElementById("upload-unsaved-saved-experience-1-title") as any)
      .classList,
  ).toContain("experience-title--success");

  expect(document.getElementById("upload-unsaved-upload-btn")).toBeNull();

  expect(
    document.getElementById("upload-triggered-icon-success-1"),
  ).not.toBeNull();

  expect(
    document.getElementById("upload-triggered-icon-success-saved-experiences"),
  ).not.toBeNull();
});

it("shows only 'unsaved experiences' data and uploading same succeeds", async () => {
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
    props: {
      getAllUnsavedProps: {
        getAllUnsaved: {
          unsavedExperiencesLen: 1,

          unsavedExperiencesMap: {
            "1": {
              experience: unsavedExperience,
              unsavedEntries: [unsavedEntry],
              savedEntries: [],
            },
          } as ExperiencesIdsToObjectMap,
        },
      } as GetAllUnSavedQueryData,
    },
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

  render(ui);

  expect(
    document.getElementById("upload-unsaved-saved-experiences-container"),
  ).toBeNull();

  expect(
    document.getElementById("upload-unsaved-saved-experiences-menu"),
  ).toBeNull();

  expect(
    document.getElementById("upload-unsaved-unsaved-experiences-container"),
  ).not.toBeNull();

  expect(
    document.getElementById("upload-unsaved-unsaved-experiences-menu"),
  ).not.toBeNull();

  expect(
    document.getElementById(
      "upload-triggered-icon-success-unsaved-experiences",
    ),
  ).toBeNull();

  expect(
    (document.getElementById(
      "upload-unsaved-unsaved-experience-1-title",
    ) as any).classList,
  ).not.toContain("experience-title--success");

  expect(document.getElementById("upload-triggered-icon-error-1")).toBeNull();

  expect(document.getElementById("upload-triggered-icon-success-1")).toBeNull();

  const tabsMenuClassList = (document.getElementById(
    "upload-unsaved-tabs-menu",
  ) as any).classList;

  expect(tabsMenuClassList).toContain("one");
  expect(tabsMenuClassList).not.toContain("two");

  fireEvent.click(document.getElementById("upload-unsaved-upload-btn") as any);

  const $successIcon = await waitForElement(() =>
    document.getElementById(
      "upload-triggered-icon-success-unsaved-experiences",
    ),
  );

  expect($successIcon).not.toBeNull();

  const {
    entries: uploadedEntries,

    ...otherExperienceFields
  } = (mockUploadUnsavedExperiences.mock.calls[0][0] as any).variables.input[0];

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
});

it("toggles saved and 'unsaved experiences' and uploads data but returns errors for both unsaved entries and unsaved experiences", async () => {
  jest.useFakeTimers();

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
    props: {
      getAllUnsavedProps: {
        getAllUnsaved: {
          unsavedExperiencesLen: 1,

          unsavedExperiencesMap: {
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

          savedExperiencesLen: 1,

          savedExperiencesMap: {
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
      } as GetAllUnSavedQueryData,
    },
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
            },
          },
        },
      ] as UploadAllUnsavedsMutation_saveOfflineExperiences[],
    } as UploadAllUnsavedsMutation,
  });

  render(ui);

  expect(
    document.getElementById("upload-unsaved-saved-experiences-container"),
  ).not.toBeNull();

  expect(
    document.getElementById("upload-unsaved-unsaved-experiences-container"),
  ).toBeNull();

  const tabsMenuClassList = (document.getElementById(
    "upload-unsaved-tabs-menu",
  ) as any).classList;

  expect(tabsMenuClassList).not.toContain("one");
  expect(tabsMenuClassList).toContain("two");

  const $unsavedMenu = document.getElementById(
    "upload-unsaved-unsaved-experiences-menu",
  ) as any;

  fireEvent.click($unsavedMenu);
  jest.runAllTimers();

  expect(
    document.getElementById("upload-unsaved-saved-experiences-container"),
  ).toBeNull();

  expect(
    document.getElementById("upload-unsaved-unsaved-experiences-container"),
  ).not.toBeNull();

  expect(
    (document.getElementById(
      "upload-unsaved-unsaved-experience-1-title",
    ) as any).classList,
  ).not.toContain("experience-title--error");

  const $savedMenu = document.getElementById(
    "upload-unsaved-saved-experiences-menu",
  ) as any;

  fireEvent.click($savedMenu);
  jest.runAllTimers();

  expect(
    document.getElementById("upload-unsaved-saved-experiences-container"),
  ).not.toBeNull();

  expect(
    document.getElementById("upload-unsaved-unsaved-experiences-container"),
  ).toBeNull();

  expect(
    (document.getElementById("upload-unsaved-saved-experience-2-title") as any)
      .classList,
  ).not.toContain("experience-title--error");

  const $entry = document.getElementById(
    `upload-unsaved-entry-${entryId}`,
  ) as any;

  expect($entry.classList).not.toContain("entry--error");

  expect(document.getElementById("upload-triggered-icon-error-1")).toBeNull();

  expect(document.getElementById("upload-triggered-icon-error-2")).toBeNull();

  expect(
    document.getElementById("upload-triggered-icon-error-saved-experiences"),
  ).toBeNull();

  expect(
    document.getElementById("upload-triggered-icon-error-unsaved-experiences"),
  ).toBeNull();

  expect(document.getElementById("unsaved-experience-errors-1")).toBeNull();

  fireEvent.click(document.getElementById("upload-unsaved-upload-btn") as any);

  const $error = await waitForElement(() =>
    document.getElementById("upload-triggered-icon-error-2"),
  );

  expect($error).not.toBeNull();

  expect(mockUploadAllUnsaveds).toHaveBeenCalled();

  expect(mockUploadUnsavedExperiences).not.toHaveBeenCalled();
  expect(mockUploadSavedExperiencesEntries).not.toHaveBeenCalled();

  expect(
    document.getElementById("upload-triggered-icon-error-saved-experiences"),
  ).not.toBeNull();

  // we are currently showing saved experiences - we confirm it has error class
  expect(
    document.getElementById("upload-unsaved-saved-experiences-container"),
  ).not.toBeNull();

  expect(
    (document.getElementById("upload-unsaved-saved-experience-2-title") as any)
      .classList,
  ).toContain("experience-title--error");

  // we also check to see that correct class has been applied to the entry
  expect($entry.classList).toContain("entry--error");

  // we toggle to show unsaved experiences and confirm they also have error
  // class
  fireEvent.click($unsavedMenu);
  jest.runAllTimers();

  expect(
    document.getElementById("upload-unsaved-unsaved-experiences-container"),
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
    document.getElementById("upload-triggered-icon-error-unsaved-experiences"),
  ).not.toBeNull();

  expect(document.getElementById("upload-unsaved-upload-btn")).not.toBeNull();

  expect(document.getElementById("unsaved-experience-errors-1")).not.toBeNull();
});

it("shows apollo errors", async () => {
  const { ui, mockUploadAllUnsaveds } = makeComp({
    props: {
      getAllUnsavedProps: {
        getAllUnsaved: {
          unsavedExperiencesLen: 1,

          unsavedExperiencesMap: {
            "1": {
              experience: {
                id: "1",
                title: "a",
                clientId: "1",

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
                } as ExperienceFragment_entries_edges_node,
              ],

              savedEntries: [],
            },
          } as ExperiencesIdsToObjectMap,

          savedExperiencesLen: 1,

          savedExperiencesMap: {
            "2": {
              experience: {
                id: "2",
                title: "b",

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
                } as ExperienceFragment_entries_edges_node,
              ],
              savedEntries: [],
            },
          } as ExperiencesIdsToObjectMap,
        } as GetUnsavedSummary,
      } as GetAllUnSavedQueryData,
    },
  });

  mockUploadAllUnsaveds.mockRejectedValue(new Error("a"));

  render(ui);

  expect(document.getElementById("upload-unsaved-server-error")).toBeNull();

  fireEvent.click(document.getElementById("upload-unsaved-upload-btn") as any);

  const $errorUi = await waitForElement(() =>
    document.getElementById("upload-unsaved-server-error"),
  );

  expect($errorUi).not.toBeNull();

  expect(mockScrollIntoView).toHaveBeenCalledWith(
    "js-scroll-into-view-server-error",
  );

  expect(
    document.getElementById(
      "upload-triggered-icon-success-unsaved-experiences",
    ),
  ).toBeNull();

  expect(
    document.getElementById("upload-triggered-icon-error-unsaved-experiences"),
  ).not.toBeNull();

  expect(
    document.getElementById("upload-triggered-icon-success-saved-experiences"),
  ).toBeNull();

  expect(
    document.getElementById("upload-triggered-icon-error-saved-experiences"),
  ).not.toBeNull();

  closeMessage($errorUi);

  expect(document.getElementById("upload-unsaved-server-error")).toBeNull();

  expect(
    document.getElementById("upload-triggered-icon-error-unsaved-experiences"),
  ).not.toBeNull();

  expect(
    document.getElementById("upload-triggered-icon-error-saved-experiences"),
  ).not.toBeNull();
});

it("deletes unsaved experience", async () => {
  const unsavedEntry = {
    id: "10",
    clientId: "10",
  } as ExperienceFragment_entries_edges_node;

  const unsavedExperience = {
    id: "1",
    entries: {
      edges: [
        {
          node: unsavedEntry,
        },
      ],
    },
  } as ExperienceFragment;

  const { ui, mockNavigate, mockLayoutDispatch } = makeComp({
    props: {
      getAllUnsavedProps: {
        getAllUnsaved: {
          unsavedExperiencesLen: 1,

          unsavedExperiencesMap: {
            "1": {
              experience: unsavedExperience,
              unsavedEntries: [unsavedEntry],
              savedEntries: [],
            },
          } as ExperiencesIdsToObjectMap,
        },
      } as GetAllUnSavedQueryData,
    },
  });

  mockReplaceExperiencesInGetExperiencesMiniQuery.mockResolvedValue({});

  render(ui);

  fireEvent.click(document.getElementById("experience-1-delete-button") as any);

  await wait(() => {
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

it("deletes saved experience", async () => {
  const { ui, mockNavigate } = makeComp({
    props: {
      getAllUnsavedProps: {
        getAllUnsaved: {
          savedExperiencesLen: 1,

          savedExperiencesMap: {
            "1": {
              experience: {
                id: "1",
              } as ExperienceFragment,
              unsavedEntries: [],
              savedEntries: [],
            },
          } as ExperiencesIdsToObjectMap,

          unsavedExperiencesLen: 1,

          unsavedExperiencesMap: {
            "2": {
              experience: {
                id: "2",
              } as ExperienceFragment,
              unsavedEntries: [],
              savedEntries: [],
            },
          } as ExperiencesIdsToObjectMap,
        },
      } as GetAllUnSavedQueryData,
    },
  });

  mockReplaceExperiencesInGetExperiencesMiniQuery.mockResolvedValue({});

  render(ui);

  expect(
    document.getElementById("upload-unsaved-saved-experiences-menu"),
  ).not.toBeNull();

  fireEvent.click(document.getElementById("experience-1-delete-button") as any);

  await wait(() => {
    expect(document.getElementById("experience-1-delete-button")).toBeNull();
  });

  expect(
    document.getElementById("upload-unsaved-saved-experiences-menu"),
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

test("experience saved but entry did not", async () => {
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
    props: {
      getAllUnsavedProps: {
        getAllUnsaved: {
          unsavedExperiencesLen: 1,

          unsavedExperiencesMap: {
            "1": {
              experience: unsavedExperience,
              unsavedEntries: [unsavedEntry],
              savedEntries: [],
            },
          } as ExperiencesIdsToObjectMap,
        },
      } as GetAllUnSavedQueryData,
    },
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

  render(ui);

  expect(
    document.getElementById(
      "upload-triggered-icon-success-unsaved-experiences",
    ),
  ).toBeNull();

  expect(document.getElementById("upload-triggered-icon-error-2")).toBeNull();

  fireEvent.click(document.getElementById("upload-unsaved-upload-btn") as any);

  const $errorIcon = await waitForElement(() =>
    document.getElementById("upload-triggered-icon-error-2"),
  );

  expect($errorIcon).not.toBeNull();

  expect(document.getElementById("upload-unsaved-upload-btn")).not.toBeNull();

  expect(document.getElementById("upload-triggered-icon-success-1")).toBeNull();

  const { entry } = mockEntry.mock.calls[
    mockEntry.mock.calls.length - 1
  ][0] as EntryProps;

  expect((entry.dataObjects[0] as DataObjectFragment).definitionId).toEqual(
    "f2", // the new definition.id
  );
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const UploadUnsavedP = UploadUnsaved as ComponentType<Partial<Props>>;

function makeComp({
  props = {},
  isConnected = true,
}: { props?: Partial<Props>; isConnected?: boolean } = {}) {
  mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache.mockReset();
  mockDeleteIdsFromCache.mockReset();
  mockReplaceExperiencesInGetExperiencesMiniQuery.mockReset();
  mockUpdateCache.mockReset();
  mockScrollIntoView.mockReset();
  mockIsConnected.mockReset();
  mockEntry.mockClear();

  mockIsConnected.mockReturnValue(isConnected);

  const mockUploadUnsavedExperiences = jest.fn();
  const mockUploadSavedExperiencesEntries = jest.fn();
  const mockUploadAllUnsaveds = jest.fn();
  const mockLayoutDispatch = jest.fn();

  const { Ui, ...routerProps } = renderWithRouter(UploadUnsavedP);

  return {
    ui: (
      <LayoutProvider
        value={
          {
            layoutDispatch: mockLayoutDispatch,
            client: {},
            cache: {},
            persistor: {
              persist: jest.fn(),
            },
          } as any
        }
      >
        <Ui
          uploadUnsavedExperiences={mockUploadUnsavedExperiences}
          createEntries={mockUploadSavedExperiencesEntries}
          uploadAllUnsaveds={mockUploadAllUnsaveds}
          {...props}
        />
      </LayoutProvider>
    ),

    mockUploadUnsavedExperiences,
    mockUploadSavedExperiencesEntries,
    mockUploadAllUnsaveds,
    mockLayoutDispatch,
    ...routerProps,
  };
}
