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
import { Props as DateTimeProps } from "../components/DateTimeField/date-time-field.utils";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import {editEntryUpdate} from '../components/EditEntry/edit-entry.update';

////////////////////////// MOCKS ////////////////////////////

jest.mock("../components/DateTimeField/date-time-field.component", () => ({
  DateTimeField: MockDateTimeField,
}));

jest.mock("../components/DateField/date-field.component", () => ({
  DateField: MockDateTimeField,
}));

it("destroys the UI", () => {
  const { ui, mockParentDispatch } = makeComp({
    props: {
      entry: {
        dataObjects: [] as DataObjectFragment[],
      } as EntryFragment,

      experience: {
        dataDefinitions: [
          {
            id: "a",
            type: FieldType.INTEGER,
            name: "f1",
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
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
    const { ui, mockUpdateDefinitionsOnline, mockEditEntryUpdate } = makeComp({
      props: {
        entry: {
          dataObjects: [] as DataObjectFragment[],
        } as EntryFragment,

        experience: {
          dataDefinitions: [
            {
              id: "a",
              type: FieldType.INTEGER,
              name: "f1",
            },
          ] as DataDefinitionFragment[],
        } as ExperienceFragment,
      },
    });

    mockUpdateDefinitionsOnline.mockResolvedValue({
      data: {
        updateDefinitions: {
          definitions: [
            {
              definition: {
                id: "a",
                name: "g1",
              },
            },
          ],
        },
      } as UpdateDefinitions,
    });

    render(ui);
    //  const { debug } = render(ui);

    // idle

    let $editBtn = makeDefinitionEdit("a");
    expect(makeDefinitionDismiss("a")).toBeNull();
    expect(makeDefinitionInput("a")).toBeNull();
    expect(makeDefinitionName("a")).not.toBeNull();

    $editBtn.click();

    // editing.unchanged

    expect(makeDefinitionEdit("a")).toBeNull();
    expect(makeDefinitionInput("a").classList).toContain(
      "definition-input-unchanged",
    );

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
    //debug();
    // editing.changed
    // we can reset by clicking reset button

    makeDefinitionReset("a").click();
    // editing.unchanged
    expect(makeDefinitionInput("a").classList).toContain(
      "definition-input-unchanged",
    );
    expect(makeDefinitionInput("a").value).toEqual("f1");
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
    expect($field.classList).not.toContain("definition--success");

    $submit.click();
    expect(document.getElementById("submitting-overlay")).not.toBeNull();
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
    expect($field.classList).toContain("definition--success");
    expect($field.classList).not.toContain("error");
    expect(document.getElementById("submitting-overlay")).toBeNull();
    expect(makeDefinitionName("a").value).toEqual("g1");
  });

  test("editing siblings, server error", async () => {
    const { ui, mockUpdateDefinitionsOnline } = makeComp({
      props: {
        entry: {
          dataObjects: [] as DataObjectFragment[],
        } as EntryFragment,

        experience: {
          dataDefinitions: [
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
        } as ExperienceFragment,
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
    expect($fieldA.classList).not.toContain("definition--success");

    fillField(makeDefinitionInput("a"), "g1");
    $submit.click();

    await wait(() => {
      expect($fieldA.classList).toContain("definition--success");
    });

    expect($fieldA.classList).not.toContain("error");
    expect($fieldC.classList).toContain("error");
    expect($fieldC.classList).not.toContain("definition--success");
  });

  test("editing data, editing definitions", async () => {
    // NOTE: default date = 2000-01-01, time = 2000-01-01T01:01:01.000Z
    const time = "2000-01-01T01:01:01.000Z";
    const date = "2000-01-01";

    const { ui } = makeComp({
      props: {
        entry: {
          dataObjects: [
            {
              id: "int",
              definitionId: "int",
              data: `{"integer":1}`,
            },

            {
              id: "dec",
              definitionId: "dec",
              data: `{"decimal":0.1}`,
            },

            {
              id: "date",
              definitionId: "date",
              data: `{"date":"${date}"}`,
            },

            {
              id: "time",
              definitionId: "time",
              data: `{"datetime":"${time}"}`,
            },

            {
              id: "text",
              definitionId: "text",
              data: `{"single_line_text":"1"}`,
            },

            {
              id: "multi",
              definitionId: "multi",
              data: `{"multi_line_text":"1"}`,
            },
          ] as DataObjectFragment[],
        } as EntryFragment,

        experience: {
          dataDefinitions: [
            {
              id: "int",
              type: FieldType.INTEGER,
              name: "int",
            },

            {
              id: "dec",
              type: FieldType.DECIMAL,
              name: "dec",
            },

            {
              id: "date",
              type: FieldType.DATE,
              name: "date",
            },

            {
              id: "time",
              type: FieldType.DATETIME,
              name: "time",
            },

            {
              id: "text",
              type: FieldType.SINGLE_LINE_TEXT,
              name: "text",
            },

            {
              id: "multi",
              type: FieldType.MULTI_LINE_TEXT,
              name: "multi",
            },
          ] as DataDefinitionFragment[],
        } as ExperienceFragment,
      },
    });

    const { debug } = render(ui);

    makeDefinitionEdit("int").click();
    makeDefinitionInput("int", "in");
    // primary state.notEdiitngData
    expect(makeDefinitionSubmit("int")).not.toBeNull();

    expect(makeSubmit()).toBeNull();
    const $int = makeDataInput("int", "2");
    const $date = makeDataInput("date", "2000-01-02");
    // primary state editingData
    expect(makeDefinitionSubmit("int")).toBeNull();
    expect(makeSubmit()).not.toBeNull();

    // revert back to int default
    fillField($int, "1");
    expect(makeSubmit()).not.toBeNull();

    // revert back to date default
    fillField($date, date);

    // primary state.notEditingData
    expect(makeSubmit()).toBeNull();
    expect(makeDefinitionSubmit("int")).not.toBeNull();

    makeDefinitionInput("int", "int");
    expect(makeDefinitionSubmit("int")).toBeNull();

    makeDataInput("time", "2000-01-02T01:01:01.000Z");
    expect(makeSubmit()).not.toBeNull();

    makeDataInput("multi", "mu");
    makeDataInput("text", "te");
    makeDataInput("dec", "de");

    makeSubmit().click();

    expect(document.getElementById("submitting-overlay")).not.toBeNull();
  });
});


test('update function', () => {
  expect(editEntryUpdate()).toBeNull()
})

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const EditEntryP = EditEntry as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const mockUpdateDefinitionsOnline = jest.fn();
  const mockParentDispatch = jest.fn();
  const mockEditEntryUpdate = jest.fn();

  return {
    ui: (
      <EditEntryP
        updateDefinitionsOnline={mockUpdateDefinitionsOnline}
        dispatch={mockParentDispatch}
        editEntryUpdate={mockEditEntryUpdate}
        {...props}
      />
    ),
    mockUpdateDefinitionsOnline,
    mockParentDispatch,
    mockEditEntryUpdate,
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

function makeDefinitionInput(id: string, val?: string) {
  const $input = makeDefinitionControl(id, "input");

  if (val) {
    fillField($input, val);
  }

  return $input;
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

function makeDataInput(id: string, val?: string) {
  const $input = document.getElementById(
    `edit-entry-data-${id}-input`,
  ) as HTMLInputElement;

  if (val) {
    fillField($input, val);
  }

  return $input;
}

function makeSubmit() {
  return document.getElementById("edit-entry-submit") as HTMLButtonElement;
}

function MockDateTimeField(props: DateTimeProps) {
  const { value, name, onChange } = props;

  const comp = (
    <input
      value={(value as Date).toJSON()}
      id={name}
      onChange={evt => {
        const val = evt.currentTarget.value;
        onChange(name, new Date(val));
      }}
    />
  );

  return comp;
}
