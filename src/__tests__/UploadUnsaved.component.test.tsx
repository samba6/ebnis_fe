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
} from "../components/UploadUnsaved/utils";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
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
jest.mock("../components/UploadUnsaved/mutation-update");
jest.mock("../components/Entry/component", () => ({
  Entry: () => null,
}));
jest.mock("../components/scroll-into-view");

import { getConnStatus } from "../state/get-conn-status";
import { onUploadSuccessUpdate } from "../components/UploadUnsaved/mutation-update";
import { scrollIntoView } from "../components/scroll-into-view";

const mockGetConnectionStatus = getConnStatus as jest.Mock;
const mockOnUploadSuccessUpdate = onUploadSuccessUpdate as jest.Mock;
const mockScrollIntoView = scrollIntoView as jest.Mock;

const timeStamps = { insertedAt: "a", updatedAt: "a" };

it("redirects to 404 when not connected", async done => {
  const { ui, mockNavigate } = makeComp({
    isConnected: false,
    props: {
      unSavedExperiencesProps: {
        unsavedExperiences: [{ id: "1", entries: {} }],
      } as any,
    },
  });

  const { queryByTestId } = render(ui);

  await wait(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/404");
  });

  expect(queryByTestId("loading")).not.toBeInTheDocument();

  done();
});

it("renders loading indicator while unsaved experiences loading", () => {
  const { ui } = makeComp({
    props: {
      unSavedExperiencesProps: { loading: true } as any,
    },
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("loading")).toBeInTheDocument();
});

it("renders loading indicator while unsaved entries for saved experiences loading", () => {
  const { ui } = makeComp({
    props: {
      savedExperiencesWithUnsavedEntriesProps: { loading: true } as any,
    },
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("loading")).toBeInTheDocument();
});

it("redirects to 404 when there are no unsaved data", async done => {
  const { ui, mockNavigate } = makeComp({
    props: {
      unSavedExperiencesProps: { unsavedExperiences: [] } as any,
      savedExperiencesWithUnsavedEntriesProps: {
        savedExperiencesWithUnsavedEntries: [],
      } as any,
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
    ...timeStamps,
  };

  const experiences = [
    {
      id: "1",
      title: "a",

      entries: {
        edges: [
          {
            node: { ...entry, id: entryId },
          },

          {
            node: {
              id: "2",
            },
          },
        ],
      },
    },
  ] as ExperienceFragment[];

  const {
    ui,
    mockUploadUnsavedExperiences,
    mockUploadSavedExperiencesEntries,
    mockUploadAllUnsaveds,
  } = makeComp({
    props: {
      savedExperiencesWithUnsavedEntriesProps: {
        savedExperiencesWithUnsavedEntries: experiences,
      } as any,
    },
  });

  mockUploadSavedExperiencesEntries.mockResolvedValue({
    data: {
      createEntries: [
        {
          experienceId: "1",
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
    (queryByTestId("saved-experience-title-1") as any).classList,
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
  expect(mockOnUploadSuccessUpdate).toHaveBeenCalledTimes(1);

  expect(
    (queryByTestId("saved-experience-title-1") as any).classList,
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
  };

  const { id: entryId, ...entry } = {
    ...makeEntryNode(),
    clientId: "b",
    expId: "1",
    ...timeStamps,
  };

  const unsavedExperience = {
    id: "1",
    ...experience,

    entries: {
      edges: [
        {
          node: { ...entry, id: entryId },
        },
      ],
    },
  };

  const {
    ui,
    mockUploadUnsavedExperiences,
    mockUploadSavedExperiencesEntries,
    mockUploadAllUnsaveds,
  } = makeComp({
    props: {
      unSavedExperiencesProps: {
        unsavedExperiences: [unsavedExperience],
      } as any,
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
    (queryByTestId("unsaved-experience-title-1") as any).classList,
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
  expect(mockOnUploadSuccessUpdate).toHaveBeenCalledTimes(1);

  expect(queryByTestId("upload-all")).not.toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-success-unsaved-experiences"),
  ).toBeInTheDocument();

  expect(
    (queryByTestId("unsaved-experience-title-1") as any).classList,
  ).toContain("experience-title--success");

  expect(queryByTestId("upload-triggered-icon-success-1")).toBeInTheDocument();

  done();
});

it("toggles saved and 'unsaved experiences' and uploads data", async done => {
  jest.useFakeTimers();

  const {
    ui,
    mockUploadUnsavedExperiences,
    mockUploadSavedExperiencesEntries,
    mockUploadAllUnsaveds,
  } = makeComp({
    props: {
      unSavedExperiencesProps: {
        unsavedExperiences: [
          {
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
          },
        ],
      } as any,

      savedExperiencesWithUnsavedEntriesProps: {
        savedExperiencesWithUnsavedEntries: [
          {
            id: "2",
            title: "a",

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
          },
        ],
      } as any,
    },
  });

  mockUploadAllUnsaveds.mockResolvedValue({
    data: {
      createEntries: [
        {
          errors: [],
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
    (queryByTestId("unsaved-experience-title-1") as any).classList,
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
    (queryByTestId("saved-experience-title-2") as any).classList,
  ).not.toContain("experience-title--error");

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
  expect(mockOnUploadSuccessUpdate).toHaveBeenCalledTimes(1);

  expect(queryByTestId("upload-triggered-icon-error-2")).toBeInTheDocument();

  expect(
    queryByTestId("upload-triggered-icon-error-saved-experiences"),
  ).toBeInTheDocument();

  // we are currently showing saved experiences - we confirm it has error class
  expect(queryByTestId("saved-experiences")).toBeInTheDocument();
  expect(
    (queryByTestId("saved-experience-title-2") as any).classList,
  ).toContain("experience-title--error");

  // we toggle to show unsaved experiences and confirm they also have error
  // class
  fireEvent.click($unsavedMenu);
  jest.runAllTimers();

  expect(queryByTestId("unsaved-experiences")).toBeInTheDocument();

  expect(
    (queryByTestId("unsaved-experience-title-1") as any).classList,
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
      unSavedExperiencesProps: {
        unsavedExperiences: [
          {
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
          },
        ],
      } as any,

      savedExperiencesWithUnsavedEntriesProps: {
        savedExperiencesWithUnsavedEntries: [
          {
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
          },
        ],
      } as any,
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

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const UploadUnsavedP = UploadUnsaved as ComponentType<Partial<Props>>;

function makeComp({
  props = {},
  isConnected = true,
}: { props?: Partial<Props>; isConnected?: boolean } = {}) {
  mockScrollIntoView.mockReset();
  mockGetConnectionStatus.mockReset();
  mockGetConnectionStatus.mockResolvedValue(isConnected);
  mockOnUploadSuccessUpdate.mockReset();

  const mockUploadUnsavedExperiences = jest.fn();
  const mockUploadSavedExperiencesEntries = jest.fn();
  const mockUploadAllUnsaveds = jest.fn();

  const { Ui, ...routerProps } = renderWithRouter(UploadUnsavedP);

  return {
    ui: (
      <Ui
        uploadUnsavedExperiences={mockUploadUnsavedExperiences}
        createEntries={mockUploadSavedExperiencesEntries}
        uploadAllUnsaveds={mockUploadAllUnsaveds}
        {...props}
      />
    ),

    mockUploadUnsavedExperiences,
    mockUploadSavedExperiencesEntries,
    mockUploadAllUnsaveds,
    ...routerProps,
  };
}
