/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";

import { Experience, getTitle } from "../components/Experience/component";
import {
  Props,
  State,
  reducer,
  EditingState,
} from "../components/Experience/utils";
import { FieldType } from "../graphql/apollo-types/globalTypes";
import { renderWithRouter } from "./test_utils";
import {
  ExperienceFragment_entries_edges,
  ExperienceFragment_fieldDefs,
} from "../graphql/apollo-types/ExperienceFragment";
import { Entry } from "../components/Entry/component";
import { EditExperienceActionType } from "../components/EditExperience/utils";
import { ExperienceNoEntryFragment } from "../graphql/apollo-types/ExperienceNoEntryFragment";

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: () => null,
}));

jest.mock("../components/EditExperience/component", () => ({
  EditExperience: () => <div className="js-editor" />,
}));

const ExperienceP = Experience as P;

beforeEach(() => {
  jest.useFakeTimers();
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
  const { queryByTestId, getByTestId } = render(ui);

  /**
   * Then we should not see loading spinner
   */
  expect(queryByTestId("loading-spinner")).not.toBeInTheDocument();

  /**
   * And we should see texts informing us that there are no entries
   */
  expect(queryByTestId("no-entries")).toBeInTheDocument();

  /**
   * And we should not see any UI for an entry
   */
  expect(queryByTestId("experience-entry")).not.toBeInTheDocument();

  fireEvent.click(getByTestId("experience-1-delete-button"));

  expect(mockOnDelete.mock.calls[0][0]).toEqual("1");
});

it("renders entries when `entries prop provided`", () => {
  /**
   * Given that experience and associated entries exist in the system
   */
  const edges = [
    {
      node: {
        id: "1",
        fields: [
          {
            defId: "1",
            data: `{"SINGLE_LINE_TEXT":"c1"}`,
          },
        ],
      },
    },

    {
      node: {
        id: "2",
        fields: [
          {
            defId: "2",
            data: `{"MULTI_LINE_TEXT":"c2"}`,
          },
        ],
      },
    },

    {
      node: {
        id: "3",
        fields: [
          {
            defId: "3",
            data: `{"DATE":"2019-05-01"}`,
          },
        ],
      },
    },

    {
      node: {
        id: "4",
        fields: [
          {
            defId: "4",
            data: `{"DATETIME":"2019-05-01"}`,
          },
        ],
      },
    },

    {
      node: {
        id: "5",
        fields: [
          {
            defId: "5",
            data: `{"DECIMAL":"500.689"}`,
          },
        ],
      },
    },

    {
      node: {
        id: "6",
        fields: [
          {
            defId: "6",
            data: `{"INTEGER":"567012"}`,
          },
        ],
      },
    },
  ] as ExperienceFragment_entries_edges[];

  const fieldDefs = [
    {
      id: "1",
      name: "f1",
      type: FieldType.SINGLE_LINE_TEXT,
    },

    {
      id: "2",
      name: "f2",
      type: FieldType.MULTI_LINE_TEXT,
    },

    {
      id: "3",
      name: "f3",
      type: FieldType.DATE,
    },

    {
      id: "4",
      name: "f4",
      type: FieldType.DATETIME,
    },

    {
      id: "5",
      name: "f5",
      type: FieldType.DECIMAL,
    },

    {
      id: "6",
      name: "f6",
      type: FieldType.INTEGER,
    },
  ] as ExperienceFragment_fieldDefs[];

  const { ui } = makeComp({
    experience: {
      fieldDefs,

      entries: { edges },
    } as any,
  });

  /**
   * When we start using the component
   */
  const { queryByTestId, getByText, container } = render(ui);

  /**
   * Then we should not see text informing us there are not entries (of course
   * we have several)
   */
  expect(queryByTestId("no-entries")).not.toBeInTheDocument();

  /**
   * And we should see the entries' field names and associated data
   */
  expect(getByText(/f1/i)).toBeInTheDocument();
  expect(getByText(/c1/i)).toBeInTheDocument();

  expect(getByText(/f2/i)).toBeInTheDocument();
  expect(getByText(/c2/i)).toBeInTheDocument();

  expect(getByText(/f3/i)).toBeInTheDocument();
  expect(getByText(/f4/i)).toBeInTheDocument();
  expect(getByText(/f5/i)).toBeInTheDocument();
  expect(getByText(/f6/i)).toBeInTheDocument();

  expect(container.getElementsByClassName("js-edit-menu")[0]).toBeUndefined();
});

it("renders entries when `entriesJSX prop provided`", () => {
  /**
   * Given that experience and associated entries exist in the system
   */
  const entryNode = {
    id: "1",
    fields: [
      {
        defId: "1",
        data: `{"SINGLE_LINE_TEXT":"c1"}`,
      },
    ],
  } as ExperienceFragment_entries_edges["node"];

  const fieldDefs = [
    {
      id: "1",
      name: "f1",
      type: FieldType.SINGLE_LINE_TEXT,
    },
  ] as ExperienceFragment_fieldDefs[];

  const entriesJSX = (
    <Entry
      entry={entryNode as any}
      fieldDefs={fieldDefs}
      entriesLen={1}
      index={0}
    />
  );

  const { ui } = makeComp({
    experience: {} as any,
    entriesJSX,
  });

  /**
   * When we start using the component
   */
  const { getByText, queryByTestId } = render(ui);

  /**
   * And we should see the entries' field names and associated data
   */
  expect(getByText(/f1/i)).toBeInTheDocument();
  expect(getByText(/c1/i)).toBeInTheDocument();

  expect(queryByTestId("no-entries")).not.toBeInTheDocument();
});

it("toggles edit", () => {
  const { ui } = makeComp({
    experience: {
      id: "a",
      entries: {
        edges: [],
      },
    } as any,
    menuOptions: { onEdit: {} } as any,
  });

  const { container } = render(ui);

  const $editMenu = container.getElementsByClassName(
    "js-edit-menu",
  )[0] as HTMLDivElement;

  $editMenu.click();

  expect(container.getElementsByClassName("js-editor")[0]).toBeDefined();
});

test("reducer", () => {
  const prevState = {} as State;

  expect(
    reducer(prevState, [EditExperienceActionType.editCancelled]).editingState,
  ).toEqual(EditingState.notEditing);

  expect(
    reducer(prevState, [
      EditExperienceActionType.editFinished,
      {} as ExperienceNoEntryFragment,
    ]).editingState,
  ).toEqual(EditingState.notEditing);
});

test("getTitle", () => {
  expect(getTitle({ title: "a" })).toEqual("a");
  expect(getTitle()).toEqual("Experience");
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

type P = ComponentType<Partial<Props>>;

function makeComp(props: Partial<Props> = {}) {
  const { Ui, mockNavigate } = renderWithRouter(ExperienceP, {});

  return {
    ui: <Ui {...props} />,
    mockNavigate,
  };
}
