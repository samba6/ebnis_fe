// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { Entry } from "../components/Entry/component";
import { Props, EntryActionTypes } from "../components/Entry/utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { ExperienceFragment_dataDefinitions } from "../graphql/apollo-types/ExperienceFragment";
import { FieldType } from "../graphql/apollo-types/globalTypes";

const EntryP = Entry as ComponentType<Partial<Props>>;

it("renders single line text", () => {
  const mockDispatch = jest.fn();

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
      dispatch: mockDispatch,
      editable: true,

      entry,

      entriesLen: 1,

      dataDefinitions: [
        {
          id: "1",
          name: "f1",
          type: FieldType.SINGLE_LINE_TEXT,
        },
      ] as ExperienceFragment_dataDefinitions[],
    },
  });

  const {} = render(ui);

  (document.getElementById(`entry-1-edit-trigger`) as HTMLElement).click();

  expect(mockDispatch.mock.calls[0][0]).toEqual([
    EntryActionTypes.editClicked,
    entry,
  ]);
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
      editable: true,

      entry,

      dataDefinitions: [
        {
          id: "2",
          name: "f2",
          type: FieldType.MULTI_LINE_TEXT,
        },
      ] as ExperienceFragment_dataDefinitions[],
    },
  });

  render(ui);

  expect(document.getElementById(`entry-2-edit-trigger`)).toBeNull();
});

it("renders date field", () => {
  const entry = {
    id: "3",
    dataObjects: [
      {
        definitionId: "3",
        data: `{"DATE":"2019-05-01"}`,
      },
    ],
  } as EntryFragment;

  const { ui } = makeComp({
    props: {
      dispatch: jest.fn(),

      entry,

      dataDefinitions: [
        {
          id: "3",
          name: "f3",
          type: FieldType.DATE,
        },
      ] as ExperienceFragment_dataDefinitions[],
    },
  });

  render(ui);

  expect(document.getElementById(`entry-3-edit-trigger`)).toBeNull();
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

      dataDefinitions: [
        {
          id: "4",
          name: "f4",
          type: FieldType.DATETIME,
        },
      ] as ExperienceFragment_dataDefinitions[],
    },
  });

  render(ui);
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

      dataDefinitions: [
        {
          id: "5",
          name: "f5",
          type: FieldType.DECIMAL,
        },
      ] as ExperienceFragment_dataDefinitions[],
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

      dataDefinitions: [
        {
          id: "6",
          name: "f6",
          type: FieldType.INTEGER,
        },
      ] as ExperienceFragment_dataDefinitions[],
    },
  });

  render(ui);

  expect(document.getElementById("custom")).not.toBeNull();
  expect(document.getElementById("entry-container-6")).toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <EntryP {...props} />,
  };
}
