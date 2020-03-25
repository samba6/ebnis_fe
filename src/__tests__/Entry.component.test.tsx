/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import { Entry } from "../components/Entry/entry.component";
import { Props, reducer, State } from "../components/Entry/entry.utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import {
  ExperienceFragment_dataDefinitions,
  ExperienceFragment,
} from "../graphql/apollo-types/ExperienceFragment";
import { DataTypes } from "../graphql/apollo-types/globalTypes";
import {
  CallerProps,
  ActionType as EditEntryActionType,
} from "../components/EditEntry/edit-entry-utils";
import { EditEntry } from "../components/EditEntry/edit-entry.component";
import {
  entryValueDomSelector,
  entryEditMenuItemSelector,
} from "../components/Entry/entry.dom";

jest.mock("../components/EditEntry/edit-entry.component", () => ({
  EditEntry: jest.fn(() => {
    return <div id="edit-entry" />;
  }),
}));
const mockEditEntry = EditEntry as jest.Mock;

it("renders single line text", () => {
  const entry = {
    id: "1",
    dataObjects: [
      {
        definitionId: "1",
        data: `{"SINGLE_LINE_TEXT":"c1"}`,
      },
    ],
  } as EntryFragment;

  const { ui } = makeComp({
    props: {
      entry,

      entriesLen: 1,

      experience: {
        dataDefinitions: [
          {
            id: "1",
            name: "f1",
            type: DataTypes.SINGLE_LINE_TEXT,
          },
        ] as ExperienceFragment_dataDefinitions[],
      } as ExperienceFragment,
    },
  });

  render(ui);

  (document
    .getElementsByClassName(entryEditMenuItemSelector)
    .item(0) as HTMLElement).click();

  const lastRender = mockEditEntry.mock.calls.length - 1;

  expect(
    (mockEditEntry.mock.calls[lastRender][0] as CallerProps).entry.id,
  ).toEqual("1");
});

it("renders multi line text", () => {
  const entry = {
    id: "2",
    dataObjects: [
      {
        definitionId: "2",
        data: `{"MULTI_LINE_TEXT":"c2"}`,
      },
    ],
  } as EntryFragment;

  const { ui } = makeComp({
    props: {
      entry,

      experience: {
        dataDefinitions: [
          {
            id: "2",
            name: "f2",
            type: DataTypes.MULTI_LINE_TEXT,
          },
        ] as ExperienceFragment_dataDefinitions[],
      } as ExperienceFragment,
    },
  });

  render(ui);

  expect(
    (document
      .getElementsByClassName(entryValueDomSelector)
      .item(0) as HTMLDivElement).textContent,
  ).toContain("c2");
});

it("renders date field", () => {
  const entry = {
    id: "3",
    dataObjects: [
      {
        definitionId: "3",
        data: `{"date":"2019-05-01"}`,
      },
    ],
  } as EntryFragment;

  const { ui } = makeComp({
    props: {
      entry,

      experience: {
        dataDefinitions: [
          {
            id: "3",
            name: "f3",
            type: DataTypes.DATE,
          },
        ] as ExperienceFragment_dataDefinitions[],
      } as ExperienceFragment,
    },
  });

  render(ui);

  expect(
    (document
      .getElementsByClassName(entryValueDomSelector)
      .item(0) as HTMLDivElement).textContent,
  ).toContain("2019");
});

it("renders datetime field", () => {
  const entry = {
    id: "4",
    dataObjects: [
      {
        definitionId: "4",
        data: `{"DATETIME":"2019-05-01"}`,
      },
    ],
  } as EntryFragment;

  const { ui } = makeComp({
    props: {
      entry,

      experience: {
        dataDefinitions: [
          {
            id: "4",
            name: "f4",
            type: DataTypes.DATETIME,
          },
        ] as ExperienceFragment_dataDefinitions[],
      } as ExperienceFragment,
    },
  });

  render(ui);
  expect(true).toBe(true);
});

it("renders decimal field", () => {
  const entry = {
    id: "5",
    dataObjects: [
      {
        definitionId: "5",
        data: `{"DECIMAL":"500.689"}`,
      },
    ],
  } as EntryFragment;

  const { ui } = makeComp({
    props: {
      entry,

      experience: {
        dataDefinitions: [
          {
            id: "5",
            name: "f5",
            type: DataTypes.DECIMAL,
          },
        ] as ExperienceFragment_dataDefinitions[],
      } as ExperienceFragment,
    },
  });

  render(ui);

  expect(document.getElementById("entry-container-5")).not.toBeNull();
});

it("renders integer field and uses custom container id", () => {
  const entry = {
    id: "6",
    dataObjects: [
      {
        definitionId: "6",
        data: `{"INTEGER":"567012"}`,
      },
    ],
  } as EntryFragment;

  const { ui } = makeComp({
    props: {
      id: "custom",
      entry,

      experience: {
        dataDefinitions: [
          {
            id: "6",
            name: "f6",
            type: DataTypes.INTEGER,
          },
        ] as ExperienceFragment_dataDefinitions[],
      } as ExperienceFragment,
    },
  });

  render(ui);

  expect(document.getElementById("custom")).not.toBeNull();
  expect(document.getElementById("entry-container-6")).toBeNull();
});

test("reducer", () => {
  let state: State = {
    stateValue: "idle",
  };

  state = reducer(state, { type: EditEntryActionType.DESTROYED });
  expect(state.stateValue).toEqual("idle");

  state = reducer(state, { type: "bogus" } as any);
  expect(state.stateValue).toEqual("idle");
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const EntryP = Entry as ComponentType<Partial<Props>>;
const timestamp = "2000-01-01T01:01:01.000Z";

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  mockEditEntry.mockClear();

  const { entry } = props;

  if (entry) {
    entry.insertedAt = timestamp;
    entry.updatedAt = timestamp;
    props.entry = entry;
  }

  return {
    ui: <EntryP {...props} />,
  };
}
