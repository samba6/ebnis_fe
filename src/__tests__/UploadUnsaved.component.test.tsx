/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait, waitForElement } from "react-testing-library";
import { UploadUnsaved } from "../components/UploadUnsaved/component";
import {
  Props,
  fieldDefToUnsavedData,
  ExperiencesIdsToObjectMap,
} from "../components/UploadUnsaved/utils";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
} from "../graphql/apollo-types/ExperienceFragment";
import { makeUnsavedId } from "../constants";
import {
  renderWithRouter,
  makeFieldDefs,
  makeEntryNode,
  closeMessage,
} from "./test_utils";

jest.mock("../components/Loading", () => ({
  Loading: () => <div data-testid="loading" />,
}));

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: ({ children }: any) => {
    return <> {children} </>;
  },
}));

jest.mock("../state/get-conn-status");
jest.mock("../components/Entry/component", () => ({
  Entry: (props: any) => {
    return (
      <div className={props.className} data-testid={props["data-testid"]} />
    );
  },
}));
jest.mock("../components/scroll-into-view");
jest.mock("../components/UploadUnsaved/update-cache");
jest.mock("../state/resolvers/update-get-experiences-mini-query");
jest.mock("../state/resolvers/delete-references-from-cache");
jest.mock("../state/resolvers/update-saved-and-unsaved-experiences-in-cache");

import { getConnStatus } from "../state/get-conn-status";
import { scrollIntoView } from "../components/scroll-into-view";
import {
  GetAllUnSavedQueryData,
  GetUnsavedSummary,
} from "../state/unsaved-resolvers";
import { updateCache } from "../components/UploadUnsaved/update-cache";
import { LayoutProvider } from "../components/Layout/layout-provider";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../state/resolvers/update-get-experiences-mini-query";
import { deleteIdsFromCache } from "../state/resolvers/delete-references-from-cache";
import { deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache } from "../state/resolvers/update-saved-and-unsaved-experiences-in-cache";
import { EXPERIENCES_URL } from "../routes";

const mockGetConnectionStatus = getConnStatus as jest.Mock;
const mockScrollIntoView = scrollIntoView as jest.Mock;
const mockUpdateCache = updateCache as jest.Mock;

const mockReplaceExperiencesInGetExperiencesMiniQuery = replaceExperiencesInGetExperiencesMiniQuery as jest.Mock;

const mockDeleteIdsFromCache = deleteIdsFromCache as jest.Mock;

const mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache = deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache as jest.Mock;

const timeStamps = { insertedAt: "a", updatedAt: "a" };

it("redirects to 404 when not connected", async done => {
  const { ui, mockNavigate } = makeComp({
    isConnected: false,
  });

  const { queryByTestId } = render(ui);

  await wait(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/404");
  });

  expect(queryByTestId("loading")).not.toBeInTheDocument();

  done();
});

it("renders loading indicator", () => {
  const { ui } = makeComp({
    props: {
      getAllUnsavedProps: {
        loading: true,
      } as GetAllUnSavedQueryData,
    },
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("loading")).toBeInTheDocument();
});

it("redirects to 404 when there are no unsaved data", async done => {
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

  const { queryByTestId } = render(ui);

  await wait(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/404");
  });

  expect(queryByTestId("loading")).not.toBeInTheDocument();

  done();
});

it("shows only saved experiences, does not show saved entries and uploads unsaved entries", async done => {
  const { id: entryId, ...entry } = {
    ...makeEntryNode(makeUnsavedId("1")),
    clientId: "a",
    expId: "1",
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

  const { queryByTestId, getAllByTestId } = render(ui);

  expect(queryByTestId("no-unsaved")).not.toBeInTheDocument();

  expect(getAllByTestId("saved-experience").length).toBe(1);

  expect(queryByTestId("saved-experiences-menu")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).not.toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences-menu")).not.toBeInTheDocument();

  expect(queryByTestId("uploading-data")).not.toBeInTheDocument();

  expect(
    queryByTestId("unsaved-entries-upload-success-icon"),
  ).not.toBeInTheDocument();

  expect(
    (queryByTestId("saved-experience-1-title") as any).classList,
  ).not.toContain("experience-title--success");

  expect(
    queryByTestId("upload-triggered-icon-success-1"),
  ).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-success-saved-experiences"),
  ).not.toBeInTheDocument();

  const tabsMenuClassList = (queryByTestId("tabs-menu") as any).classList;

  expect(tabsMenuClassList).toContain("one");
  expect(tabsMenuClassList).not.toContain("two");

  fireEvent.click(queryByTestId("upload-all") as any);

  await wait(() => {
    expect(mockUploadSavedExperiencesEntries).toHaveBeenCalled();
  });

  const uploadedEntry = (mockUploadSavedExperiencesEntries.mock
    .calls[0][0] as any).variables.createEntries[0];

  expect(uploadedEntry).toEqual(entry);

  expect(mockUploadUnsavedExperiences).not.toHaveBeenCalled();
  expect(mockUploadAllUnsaveds).not.toHaveBeenCalled();

  expect(
    (queryByTestId("saved-experience-1-title") as any).classList,
  ).toContain("experience-title--success");

  expect(queryByTestId("upload-all")).not.toBeInTheDocument();

  expect(queryByTestId("upload-triggered-icon-success-1")).toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-success-saved-experiences"),
  ).toBeInTheDocument();

  done();
});

it("shows only 'unsaved experiences' data and uploading same succeeds", async done => {
  const experience = {
    title: "a",
    clientId: "1",
    description: "x",
    fieldDefs: makeFieldDefs(),
    ...timeStamps,
  } as ExperienceFragment;

  const { id: entryId, ...entry } = {
    ...makeEntryNode(),
    clientId: "b",
    expId: "1",
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

  const { queryByTestId } = render(ui);

  expect(queryByTestId("saved-experiences")).not.toBeInTheDocument();
  expect(queryByTestId("saved-experiences-menu")).not.toBeInTheDocument();

  expect(queryByTestId("unsaved-experiences")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences-menu")).toBeInTheDocument();

  expect(queryByTestId("uploading-data")).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-success-unsaved-experiences"),
  ).not.toBeInTheDocument();

  expect(
    (queryByTestId("unsaved-experience-1-title") as any).classList,
  ).not.toContain("experience-title--success");

  expect(
    queryByTestId("upload-triggered-icon-error-1"),
  ).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-success-1"),
  ).not.toBeInTheDocument();

  const tabsMenuClassList = (queryByTestId("tabs-menu") as any).classList;

  expect(tabsMenuClassList).toContain("one");
  expect(tabsMenuClassList).not.toContain("two");

  fireEvent.click(queryByTestId("upload-all") as any);

  await wait(() => {
    expect(mockUploadUnsavedExperiences).toHaveBeenCalled();
  });

  const {
    entries: uploadedEntries,

    ...otherExperienceFields
  } = (mockUploadUnsavedExperiences.mock.calls[0][0] as any).variables.input[0];

  experience.fieldDefs = experience.fieldDefs.map(fieldDefToUnsavedData as any);

  expect(otherExperienceFields).toEqual(experience);

  expect(uploadedEntries[0]).toEqual(entry);

  expect(mockUploadSavedExperiencesEntries).not.toHaveBeenCalled();
  expect(mockUploadAllUnsaveds).not.toHaveBeenCalled();

  expect(queryByTestId("upload-all")).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-success-unsaved-experiences"),
  ).toBeInTheDocument();

  expect(
    (queryByTestId("unsaved-experience-1-title") as any).classList,
  ).toContain("experience-title--success");

  expect(queryByTestId("upload-triggered-icon-success-1")).toBeInTheDocument();

  done();
});

it("toggles saved and 'unsaved experiences' and uploads data", async done => {
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
                fieldDefs: makeFieldDefs(),

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
                fieldDefs: makeFieldDefs(),

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
              error: `${entryId} error`,
            },
          ],

          experienceId: "2",
        },
      ],

      saveOfflineExperiences: [
        {
          experienceError: {
            clientId: "1",
            error: "experience error",
          },
        },
      ],
    },
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("saved-experiences")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).not.toBeInTheDocument();

  const tabsMenuClassList = (queryByTestId("tabs-menu") as any).classList;

  expect(tabsMenuClassList).not.toContain("one");
  expect(tabsMenuClassList).toContain("two");

  const $unsavedMenu = queryByTestId("unsaved-experiences-menu") as any;

  fireEvent.click($unsavedMenu);
  jest.runAllTimers();

  expect(queryByTestId("saved-experiences")).not.toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).toBeInTheDocument();

  expect(
    (queryByTestId("unsaved-experience-1-title") as any).classList,
  ).not.toContain("experience-title--error");

  const $savedMenu = queryByTestId("saved-experiences-menu") as any;

  fireEvent.click($savedMenu);
  jest.runAllTimers();

  expect(queryByTestId("saved-experiences")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).not.toBeInTheDocument();

  expect(
    queryByTestId("unsaved-experiences-upload-error-icon"),
  ).not.toBeInTheDocument();

  expect(
    queryByTestId("unsaved-entries-upload-error-icon"),
  ).not.toBeInTheDocument();

  expect(
    (queryByTestId("saved-experience-2-title") as any).classList,
  ).not.toContain("experience-title--error");

  expect((queryByTestId(`entry-${entryId}`) as any).classList).not.toContain(
    "entry--error",
  );

  expect(
    queryByTestId("upload-triggered-icon-error-1"),
  ).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-error-2"),
  ).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-error-saved-experiences"),
  ).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-error-unsaved-experiences"),
  ).not.toBeInTheDocument();

  expect(queryByTestId("unsaved-experience-errors-1")).not.toBeInTheDocument();

  fireEvent.click(queryByTestId("upload-all") as any);

  await wait(() => {
    expect(mockUploadAllUnsaveds).toHaveBeenCalled();
  });

  expect(mockUploadUnsavedExperiences).not.toHaveBeenCalled();
  expect(mockUploadSavedExperiencesEntries).not.toHaveBeenCalled();

  expect(queryByTestId("upload-triggered-icon-error-2")).toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-error-saved-experiences"),
  ).toBeInTheDocument();

  // we are currently showing saved experiences - we confirm it has error class
  expect(queryByTestId("saved-experiences")).toBeInTheDocument();
  expect(
    (queryByTestId("saved-experience-2-title") as any).classList,
  ).toContain("experience-title--error");

  // we also check to see that correct class has been applied to the entry
  expect((queryByTestId(`entry-${entryId}`) as any).classList).toContain(
    "entry--error",
  );

  // we toggle to show unsaved experiences and confirm they also have error
  // class
  fireEvent.click($unsavedMenu);
  jest.runAllTimers();

  expect(queryByTestId("unsaved-experiences")).toBeInTheDocument();

  expect(
    (queryByTestId("unsaved-experience-1-title") as any).classList,
  ).toContain("experience-title--error");

  expect(queryByTestId("upload-triggered-icon-error-1")).toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-error-unsaved-experiences"),
  ).toBeInTheDocument();

  expect(queryByTestId("upload-all")).toBeInTheDocument();

  expect(queryByTestId("unsaved-experience-errors-1")).toBeInTheDocument();

  done();
});

it("shows apollo errors", async done => {
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

  const { queryByTestId } = render(ui);

  expect(queryByTestId("server-error")).not.toBeInTheDocument();

  fireEvent.click(queryByTestId("upload-all") as any);

  const $errorUi = await waitForElement(() => queryByTestId("server-error"));

  expect($errorUi).toBeInTheDocument();

  expect(mockScrollIntoView).toHaveBeenCalledWith(
    "js-scroll-into-view-server-error",
  );

  expect(
    queryByTestId("upload-triggered-icon-success-unsaved-experiences"),
  ).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-error-unsaved-experiences"),
  ).toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-success-saved-experiences"),
  ).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-error-saved-experiences"),
  ).toBeInTheDocument();

  closeMessage($errorUi);

  expect(queryByTestId("server-error")).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-error-unsaved-experiences"),
  ).toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-error-saved-experiences"),
  ).toBeInTheDocument();

  done();
});

it("deletes unsaved experience", async done => {
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

  const { getByTestId, queryByTestId } = render(ui);

  fireEvent.click(getByTestId("experience-1-delete-button") as any);

  await wait(() => {
    expect(queryByTestId("experience-1-delete-button")).not.toBeInTheDocument();
  });

  expect(mockReplaceExperiencesInGetExperiencesMiniQuery).toHaveBeenCalledWith(
    {},
    { "1": null },
  );

  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith({}, ["1", "10"]);

  expect(
    mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache,
  ).toHaveBeenCalledWith({}, ["1"]);

  expect(mockNavigate).toHaveBeenCalledWith(EXPERIENCES_URL);

  expect(mockLayoutDispatch).toHaveBeenCalled();

  done();
});

it("deletes saved experience", async done => {
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

  const { getByTestId, queryByTestId } = render(ui);

  expect(getByTestId("saved-experiences-menu")).toBeInTheDocument();

  fireEvent.click(getByTestId("experience-1-delete-button") as any);

  await wait(() => {
    expect(queryByTestId("experience-1-delete-button")).not.toBeInTheDocument();
  });

  expect(queryByTestId("saved-experiences-menu")).not.toBeInTheDocument();

  expect(mockNavigate).not.toHaveBeenCalled();

  expect(mockReplaceExperiencesInGetExperiencesMiniQuery).toHaveBeenCalledWith(
    {},
    { "1": null },
  );

  expect(mockDeleteIdsFromCache).toHaveBeenCalledWith({}, ["1"]);

  expect(
    mockDeleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache,
  ).toHaveBeenCalledWith({}, ["1"]);

  done();
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
  mockGetConnectionStatus.mockReset();
  mockGetConnectionStatus.mockResolvedValue(isConnected);

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
