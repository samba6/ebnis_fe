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
import {
  UpdateDefinitions,
  UpdateDefinitions_updateDefinitions,
  UpdateDefinitions_updateDefinitions_definitions,
} from "../graphql/apollo-types/UpdateDefinitions";

////////////////////////// MOCKS ////////////////////////////

jest.mock("../components/EditEntry/edit-entry.update.ts");
import { editEntryUpdate } from "../components/EditEntry/edit-entry.update";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
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

describe("editing definitions not editing data", () => {
  test("no siblings, form errors, server success", async () => {
    const { ui, mockUpdateDefinitionsOnline } = makeComp({
      props: {
        entry: {
          dataObjects: [] as DataObjectFragment[],
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

    let $editBtn = makeDefinitionEdit("a");
    expect(makeDefinitionDismiss("a")).toBeNull();
    expect(makeDefinitionInput("a")).toBeNull();
    expect(makeDefinitionName("a")).not.toBeNull();

    $editBtn.click();

    // editing.unchanged

    expect(makeDefinitionEdit("a")).toBeNull();
    expect(makeDefinitionEdit("a")).toBeNull();

    let $dismiss = makeDefinitionDismiss("a");
    $dismiss.click();

    // back to idle

    expect(makeDefinitionDismiss("a")).toBeNull();

    $editBtn = makeDefinitionEdit("a");
    $editBtn.click();

    // editing.unchanged

    expect(makeDefinitionReset("a")).toBeNull();

    let $input = makeDefinitionInput("a");
    fillField($input, "g1");

    // editing.changed
    // we can dismiss

    $dismiss = makeDefinitionDismiss("a");
    $dismiss.click();

    // back to idle

    $editBtn = makeDefinitionEdit("a");
    $editBtn.click();

    // editing.unchanged
    // we can not reset

    expect(makeDefinitionReset("a")).toBeNull();

    fillField(makeDefinitionInput("a"), "g1");

    // editing.changed
    // we can reset by clicking reset button
    //debug();

    makeDefinitionReset("a").click();
    // editing.unchanged

    expect(makeDefinitionReset("a")).toBeNull();

    fillField(makeDefinitionInput("a"), "g1");

    // editing.changed
    // OR we can reset by changing to default value

    fillField(makeDefinitionInput("a"), "f1  ");

    // editing.unchanged

    expect(makeDefinitionSubmit("a")).toBeNull();
    expect(makeDefinitionReset("a")).toBeNull();
    fillField(makeDefinitionInput("a"), "g  ");

    // editing.changed.form

    const $submit = makeDefinitionSubmit("a");
    const $field = makeDefinitionField("a");

    expect($field.classList).not.toContain("error");

    $submit.click();

    // editing.changed.formErrors

    expect(makeDefinitionError("a")).not.toBeNull();
    expect($field.classList).toContain("error");
    fillField(makeDefinitionInput("a"), "g1  ");
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

  test("editing siblings, server error", async () => {
    const { ui, mockUpdateDefinitionsOnline } = makeComp({
      props: {
        entry: {
          dataObjects: [] as DataObjectFragment[],
        } as EntryFragment,

        definitions: [
          {
            id: "a",
            type: FieldType.INTEGER,
            name: "f1",
          },

          {
            id: "b",
            type: FieldType.DECIMAL,
            name: "f2",
          },

          {
            id: "c",
            type: FieldType.INTEGER,
            name: "f3",
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
            } as UpdateDefinitions_updateDefinitions_definitions,

            {
              errors: {
                id: "c",

                errors: {
                  name: "n",
                  definition: "",
                  __typename: "DataDefinitionError",
                },
              },
            },
          ] as UpdateDefinitions_updateDefinitions_definitions[],
        } as UpdateDefinitions_updateDefinitions,
      } as UpdateDefinitions,
    });

    render(ui);
    // const { debug } = render(ui);

    expect(makeDefinitionInput("a")).toBeNull();
    makeDefinitionEdit("a").click();

    // a = editing.unchanged
    expect(makeDefinitionSubmit("a")).toBeNull();
    fillField(makeDefinitionInput("a"), "g1");
    // a = editing.changed
    expect(makeDefinitionSubmit("a")).not.toBeNull();

    expect(makeDefinitionInput("b")).toBeNull();
    makeDefinitionEdit("b").click();
    // b = editing.unchanged
    fillField(makeDefinitionInput("b"), "g2");
    // b = editing.changed.editingSiblings
    expect(makeDefinitionSubmit("b")).toBeNull();

    // a = editing.changed.editingSiblings.firstEditableSibling
    expect(makeDefinitionSubmit("a")).not.toBeNull();

    expect(makeDefinitionReset("a")).not.toBeNull();
    fillField(makeDefinitionInput("a"), "f1");

    // a = editing.unchanged
    expect(makeDefinitionReset("a")).toBeNull();

    // b = editing.changed.notEditingSiblings
    expect(makeDefinitionSubmit("b")).not.toBeNull();

    expect(makeDefinitionInput("c")).toBeNull();
    makeDefinitionEdit("c").click();
    fillField(makeDefinitionInput("c"), "g3");
    // c = editing.changed.editingSiblings
    expect(makeDefinitionSubmit("c")).toBeNull();
    // b = ediitng.changed.editingSiblings.firstEditableSiblings
    expect(makeDefinitionSubmit("b")).not.toBeNull();

    makeDefinitionDismiss("b").click();
    // b = idle
    expect(makeDefinitionInput("b")).toBeNull();
    // c = editing.changed.notEditingSiblings
    expect(makeDefinitionSubmit("c")).not.toBeNull();

    fillField(makeDefinitionInput("a"), "g");
    // c = editing.changed.editingSiblings
    expect(makeDefinitionSubmit("c")).toBeNull();

    makeDefinitionEdit("b").click();
    // b should be unchanged because adding only whitespace does not count
    fillField(makeDefinitionInput("b"), "f2     ");
    // b = editing.unchanged
    expect(makeDefinitionReset("b")).toBeNull();

    const $fieldA = makeDefinitionField("a");
    expect($fieldA.classList).not.toContain("error");

    const $fieldC = makeDefinitionField("c");

    // a = editing.changed.editingSiblings.firstEditableSibling
    const $submit = makeDefinitionSubmit("a");
    $submit.click();

    // a = editing.changed.form.formErrors
    await wait(() => {
      expect($fieldA.classList).toContain("error");
    });

    expect($fieldC.classList).not.toContain("error");
    expect($fieldC.classList).not.toContain("success");
    expect($fieldA.classList).not.toContain("success");

    fillField(makeDefinitionInput("a"), "g1");
    $submit.click();

    await wait(() => {
      expect($fieldA.classList).toContain("success");
    });

    expect($fieldA.classList).not.toContain("error");
    expect($fieldC.classList).toContain("error");
    expect($fieldC.classList).not.toContain("success");
  });
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

function makeDefinitionControl(id: string, control?: string) {
  return document.getElementById(
    `edit-entry-definition-${id}` + (control ? `-${control}` : ""),
  ) as HTMLInputElement;
}

function makeDefinitionField(id: string) {
  return makeDefinitionControl(id);
}

function makeDefinitionReset(id: string) {
  return makeDefinitionControl(id, "reset");
}

function makeDefinitionInput(id: string) {
  return makeDefinitionControl(id, "input");
}

function makeDefinitionSubmit(id: string) {
  return makeDefinitionControl(id, "submit");
}

function makeDefinitionDismiss(id: string) {
  return makeDefinitionControl(id, "dismiss");
}

function makeDefinitionEdit(id: string) {
  return makeDefinitionControl(id, "edit-btn");
}

function makeDefinitionName(id: string) {
  return makeDefinitionControl(id, "name");
}

function makeDefinitionError(id: string) {
  return makeDefinitionControl(id, "error");
}
