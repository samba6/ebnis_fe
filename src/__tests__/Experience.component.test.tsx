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
import { renderWithRouter } from "./test_utils";
import {
  ExperienceFragment_entries_edges,
  ExperienceFragment_fieldDefs,
} from "../graphql/apollo-types/ExperienceFragment";
import { EditExperienceActionType } from "../components/EditExperience/utils";
import { EditEntryStateTag } from "../components/EditEntry/utils";
import { EntryActionTypes } from "../components/Entry/utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";

jest.mock("../components/Experience/loadables", () => ({
  EditExperience: () => <div id="js-editor" />,

  EditEntry: () => <div id="entry-edit-modal" />,
}));

jest.mock("../components/Entry/component", () => ({
  Entry: () => <div id="default-entry" />,
}));

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
  render(ui);

  /**
   * And we should see texts informing us that there are no entries
   */
  expect(document.getElementById("experience-no-entries")).not.toBeNull();

  fireEvent.click(document.getElementById("experience-1-delete-button") as any);

  expect(mockOnDelete.mock.calls[0][0]).toEqual("1");
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

  const fieldDefs = [{}] as ExperienceFragment_fieldDefs[];

  const { ui } = makeComp({
    experience: {
      id: "1",
      fieldDefs,

      entries: { edges },
    } as any,
    updateEntry: jest.fn(),
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
  const prevState = { editingState: "0" as any } as State;

  expect(
    reducer(prevState, [EditExperienceActionType.aborted]).editingState,
  ).toEqual([EditingState.notEditing]);

  expect(
    reducer(prevState, [EditExperienceActionType.completed]).editingState,
  ).toEqual([EditingState.notEditing]);

  expect(reducer(prevState, [EditEntryStateTag.aborted]).editingState).toEqual([
    EditingState.notEditing,
  ]);

  expect(
    reducer(prevState, [EditEntryStateTag.completed]).editingState,
  ).toEqual([EditingState.notEditing]);

  expect(reducer(prevState, ["" as any]).editingState).toEqual("0");

  expect(
    reducer(prevState, [EntryActionTypes.editClicked, {} as EntryFragment])
      .editingState,
  ).toEqual([EditingState.editingEntry, {}]);
});

test("getTitle", () => {
  expect(getTitle({ title: "a" })).toEqual("a");
  expect(getTitle()).toEqual("Experience");
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const ExperienceP = Experience as P;

type P = ComponentType<Partial<Props>>;

function makeComp(props: Partial<Props> = {}) {
  const { Ui, mockNavigate } = renderWithRouter(ExperienceP, {});

  return {
    ui: <Ui {...props} />,
    mockNavigate,
  };
}
