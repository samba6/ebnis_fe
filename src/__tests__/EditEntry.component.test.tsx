// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, wait } from "react-testing-library";
import { EditEntry } from "../components/EditEntry/edit-entry-component";
import { Props, ActionTypes } from "../components/EditEntry/edit-entry-utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import {
  FieldType,
  UpdateDefinitionInput,
} from "../graphql/apollo-types/globalTypes";
import { fillField, closeMessage, ToInputVariables } from "./test_utils";
import { UpdateDefinitions } from "../graphql/apollo-types/UpdateDefinitions";

////////////////////////// MOCKS ////////////////////////////

jest.mock("../components/EditEntry/edit-entry.update.ts");
import { editEntryUpdate } from "../components/EditEntry/edit-entry.update";
const mockEditEntryUpdate = editEntryUpdate as jest.Mock;

const EditEntryP = EditEntry as ComponentType<Partial<Props>>;

it("destroys the UI", () => {
  const { ui, mockParentDispatch } = makeComp({
    props: {
      entry: {
        dataObjects: [
          {
            definitionId: "a",
            data: `{"integer":1}`,
          },
        ],
      } as EntryFragment,

      definitions: [
        {
          id: "a",
          type: FieldType.INTEGER,
          name: "f1",
        },
      ] as DataDefinitionFragment[],
    },
  });

  render(ui);

  const $element = document.getElementById("edit-entry-modal");
  closeMessage($element);

  expect((mockParentDispatch.mock.calls[0][0] as any).type).toEqual(
    ActionTypes.DESTROYED,
  );
});

test("definitions not editing data - submission success", async () => {
  const { ui, mockUpdateDefinitionsOnline } = makeComp({
    props: {
      entry: {
        dataObjects: [
          {
            definitionId: "a",
            data: `{"integer":1}`,
          },
        ],
      } as EntryFragment,

      definitions: [
        {
          id: "a",
          type: FieldType.INTEGER,
          name: "f1",
        },
      ] as DataDefinitionFragment[],
    },
  });

  mockUpdateDefinitionsOnline.mockResolvedValue({
    data: {
      updateDefinitions: {
        definitions: [
          {
            definition: {
              id: "a",
            },
          },
        ],
      },
    } as UpdateDefinitions,
  });

  render(ui);
  // const { debug } = render(ui);

  // idle

  let $editBtn = document.getElementById(
    "edit-entry-definition-a-edit-btn",
  ) as any;

  expect(document.getElementById("edit-entry-definition-a-dismiss")).toBeNull();

  expect(document.getElementById("edit-entry-definition-a-input")).toBeNull();

  expect(
    document.getElementById("edit-entry-definition-a-name"),
  ).not.toBeNull();

  $editBtn.click();

  // editing.unchanged

  expect(
    document.getElementById("edit-entry-definition-a-edit-btn"),
  ).toBeNull();

  expect(document.getElementById("edit-entry-definition-a-name")).toBeNull();

  let $dismiss = document.getElementById(
    "edit-entry-definition-a-dismiss",
  ) as any;

  $dismiss.click();

  // back to idle

  expect(document.getElementById("edit-entry-definition-a-dismiss")).toBeNull();

  $editBtn = document.getElementById("edit-entry-definition-a-edit-btn") as any;
  $editBtn.click();

  // editing.unchanged

  expect(document.getElementById("edit-entry-definition-a-reset")).toBeNull();

  let $input = document.getElementById("edit-entry-definition-a-input") as any;

  fillField($input, "g1");

  // editing.changed
  // we can dismiss

  $dismiss = document.getElementById("edit-entry-definition-a-dismiss") as any;

  $dismiss.click();

  // back to idle

  $editBtn = document.getElementById("edit-entry-definition-a-edit-btn") as any;
  $editBtn.click();

  // editing.unchanged
  // we can not reset

  expect(document.getElementById("edit-entry-definition-a-reset")).toBeNull();

  fillField(
    document.getElementById("edit-entry-definition-a-input") as any,
    "g1",
  );

  // editing.changed
  // we can reset by clicking reset button
  //debug();

  (document.getElementById("edit-entry-definition-a-reset") as any).click();

  // editing.unchanged

  expect(document.getElementById("edit-entry-definition-a-reset")).toBeNull();

  fillField(
    document.getElementById("edit-entry-definition-a-input") as any,
    "g1",
  );

  // editing.changed
  // OR we can reset by changing to default value

  fillField(
    document.getElementById("edit-entry-definition-a-input") as any,
    "f1  ",
  );

  // editing.unchanged

  expect(document.getElementById("edit-entry-definition-a-submit")).toBeNull();

  expect(document.getElementById("edit-entry-definition-a-reset")).toBeNull();

  fillField(
    document.getElementById("edit-entry-definition-a-input") as any,
    "g  ",
  );

  // editing.changed.form

  const $submit = document.getElementById(
    "edit-entry-definition-a-submit",
  ) as any;

  const $field = document.getElementById(
    "edit-entry-definition-a",
  ) as HTMLElement;

  expect($field.classList).not.toContain("error");

  $submit.click();

  // editing.changed.formErrors

  expect(
    document.getElementById("edit-entry-definition-a-error"),
  ).not.toBeNull();

  expect($field.classList).toContain("error");

  fillField(
    document.getElementById("edit-entry-definition-a-input") as any,
    "g1  ",
  );

  $submit.click();

  // submitting

  await wait(() => {
    const mock = mockUpdateDefinitionsOnline.mock
      .calls[0][0] as ToInputVariables<UpdateDefinitionInput[]>;

    expect(mock.variables.input).toMatchObject([
      {
        id: "a",
        name: "g1",
      },
    ]);

    expect(mock.update).toBe(mockEditEntryUpdate);
  });

  // back to idle, with success
  expect($field.classList).toContain("success");
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  mockEditEntryUpdate.mockReset();
  const mockUpdateDefinitionsOnline = jest.fn();
  const mockParentDispatch = jest.fn();

  return {
    ui: (
      <EditEntryP
        updateDefinitionsOnline={mockUpdateDefinitionsOnline}
        dispatch={mockParentDispatch}
        {...props}
      />
    ),
    mockUpdateDefinitionsOnline,
    mockParentDispatch,
  };
}
