// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, waitForElement } from "react-testing-library";
import { Sync } from "../components/Sync/component";
import { Props } from "../components/Sync/utils";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { makeUnsavedId } from "../constants";
import { renderWithRouter } from "./test_utils";

jest.mock("../components/Loading", () => ({
  Loading: () => <div data-testid="loading" />
}));

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: ({ children }: any) => {
    return <> {children} </>;
  }
}));

const SyncP = Sync as ComponentType<Partial<Props>>;
const timeStamps = { insertedAt: "a", updatedAt: "a" };

it("renders loading indicator while unsaved experiences loading", () => {
  const { ui } = makeComp({
    props: {
      unSavedExperiencesProps: { loading: true } as any
    }
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("loading")).toBeInTheDocument();
});

it("renders loading indicator while unsaved entries for saved experiences loading", () => {
  const { ui } = makeComp({
    props: {
      savedExperiencesUnSavedEntriesProps: { loading: true } as any
    }
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("loading")).toBeInTheDocument();
});

it("shows there are no unsaved data", () => {
  const { ui } = makeComp({
    props: {
      unSavedExperiencesProps: { unsavedExperiences: [] } as any,
      savedExperiencesUnSavedEntriesProps: {
        savedExperiencesUnsavedEntries: []
      } as any
    }
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("loading")).not.toBeInTheDocument();
  expect(queryByTestId("no-unsaved")).toBeInTheDocument();
});

it("shows only saved experiences, does not show saved entries and uploads unsaved entries", async done => {
  const { id: entryId, ...entry } = {
    ...makeEntryNode(makeUnsavedId("1")),
    clientId: "a",
    expId: "1",
    ...timeStamps
  };

  const experiences = [
    {
      id: "1",
      title: "a",

      entries: {
        edges: [
          {
            node: { ...entry, id: entryId }
          },

          {
            node: {
              id: "2"
            }
          }
        ]
      },

      fieldDefs: makeFieldDefs()
    }
  ] as ExperienceFragment[];

  const {
    ui,
    mockUploadUnsavedExperiences,
    mockUploadSavedExperiencesEntries
  } = makeComp({
    props: {
      savedExperiencesUnSavedEntriesProps: {
        savedExperiencesUnsavedEntries: experiences
      } as any
    }
  });

  const { queryByTestId, getAllByTestId } = render(ui);

  expect(queryByTestId("no-unsaved")).not.toBeInTheDocument();

  expect(getAllByTestId("saved-experience").length).toBe(1);

  expect(queryByTestId("saved-experiences-menu")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).not.toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences-menu")).not.toBeInTheDocument();

  expect(queryByTestId("uploading-data")).not.toBeInTheDocument();

  fireEvent.click(queryByTestId("upload-all") as any);

  const $uploadIndicatorUi = await waitForElement(() =>
    queryByTestId("uploading-data")
  );

  expect($uploadIndicatorUi).toBeInTheDocument();

  const uploadedEntry = (mockUploadSavedExperiencesEntries.mock
    .calls[0][0] as any).variables.createEntries[0];

  expect(uploadedEntry).toEqual(entry);

  expect(mockUploadUnsavedExperiences).not.toHaveBeenCalled();

  done();
});

it("shows only 'unsaved experiences' data and uploads same", async done => {
  const experience = {
    title: "a",
    clientId: "1",
    description: "x",
    fieldDefs: makeFieldDefs(),
    ...timeStamps
  };

  const { id: entryId, ...entry } = {
    ...makeEntryNode(),
    clientId: "b",
    expId: "1",
    ...timeStamps
  };

  const {
    ui,
    mockUploadUnsavedExperiences,
    mockUploadSavedExperiencesEntries
  } = makeComp({
    props: {
      unSavedExperiencesProps: {
        unsavedExperiences: [
          {
            id: "1",
            ...experience,

            entries: {
              edges: [
                {
                  node: { ...entry, id: entryId }
                }
              ]
            }
          }
        ]
      } as any
    }
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("saved-experiences")).not.toBeInTheDocument();
  expect(queryByTestId("saved-experiences-menu")).not.toBeInTheDocument();

  expect(queryByTestId("unsaved-experiences")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences-menu")).toBeInTheDocument();

  expect(queryByTestId("uploading-data")).not.toBeInTheDocument();

  fireEvent.click(queryByTestId("upload-all") as any);

  const $uploadIndicatorUi = await waitForElement(() =>
    queryByTestId("uploading-data")
  );

  expect($uploadIndicatorUi).toBeInTheDocument();

  const {
    entries: uploadedEntries,

    ...otherExperienceFields
  } = (mockUploadUnsavedExperiences.mock.calls[0][0] as any).variables.input[0];

  expect(otherExperienceFields).toEqual(experience);

  expect(uploadedEntries[0]).toEqual(entry);

  expect(mockUploadSavedExperiencesEntries).not.toHaveBeenCalled();

  done();
});

it("toggles saved and 'unsaved experiences' data", () => {
  jest.useFakeTimers();

  const { ui } = makeComp({
    props: {
      unSavedExperiencesProps: {
        unsavedExperiences: [
          {
            id: "1",
            title: "a",

            entries: {
              edges: [
                {
                  node: makeEntryNode()
                }
              ]
            },

            fieldDefs: makeFieldDefs()
          }
        ]
      } as any,

      savedExperiencesUnSavedEntriesProps: {
        savedExperiencesUnsavedEntries: [
          {
            id: "1",
            title: "a",

            entries: {
              edges: [
                {
                  node: makeEntryNode(makeUnsavedId("1"))
                }
              ]
            },

            fieldDefs: makeFieldDefs()
          }
        ]
      } as any
    }
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("saved-experiences")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).not.toBeInTheDocument();

  const $unsavedMenu = queryByTestId("unsaved-experiences-menu") as any;

  fireEvent.click($unsavedMenu);
  jest.runAllTimers();

  expect(queryByTestId("saved-experiences")).not.toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).toBeInTheDocument();

  const $savedMenu = queryByTestId("saved-experiences-menu") as any;

  fireEvent.click($savedMenu);
  jest.runAllTimers();

  expect(queryByTestId("saved-experiences")).toBeInTheDocument();
  expect(queryByTestId("unsaved-experiences")).not.toBeInTheDocument();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const mockUploadUnsavedExperiences = jest.fn();
  const mockUploadSavedExperiencesEntries = jest.fn();

  const { Ui, ...routerProps } = renderWithRouter(SyncP);

  return {
    ui: (
      <Ui
        uploadUnsavedExperiences={mockUploadUnsavedExperiences}
        createEntries={mockUploadSavedExperiencesEntries}
        {...props}
      />
    ),

    mockUploadUnsavedExperiences,
    mockUploadSavedExperiencesEntries,
    ...routerProps
  };
}

function makeEntryNode(id: string = "1") {
  return {
    id,

    fields: [
      {
        defId: "f1",
        data: `{"decimal":1}`
      }
    ]
  };
}

function makeFieldDefs() {
  return [{ id: "f1", type: "DECIMAL" as any }];
}
