// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, wait, waitForElement } from "react-testing-library";
import { EditEntry } from "../components/EditEntry/edit-entry-component";
import { Props, ActionTypes } from "../components/EditEntry/edit-entry-utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import {
  FieldType,
  UpdateDefinitionInput,
} from "../graphql/apollo-types/globalTypes";
import {
  fillField,
  closeMessage,
  ToInputVariables,
  ToVariables,
} from "./test_utils";
import {
  UpdateDefinitions,
  UpdateDefinitions_updateDefinitions,
  UpdateDefinitions_updateDefinitions_definitions,
} from "../graphql/apollo-types/UpdateDefinitions";
import { Props as DateTimeProps } from "../components/DateTimeField/date-time-field.utils";
import { DataObjectFragment } from "../graphql/apollo-types/DataObjectFragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { editEntryUpdate } from "../components/EditEntry/edit-entry.update";
import {
  UpdateDefinitionAndData,
  UpdateDefinitionAndDataVariables,
} from "../graphql/apollo-types/UpdateDefinitionAndData";
import { UpdateDataObjects_updateDataObjects } from "../graphql/apollo-types/UpdateDataObjects";

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

  destroyModal();

  expect((mockParentDispatch.mock.calls[0][0] as any).type).toEqual(
    ActionTypes.DESTROYED,
  );
});

test("not editing data, no siblings, form errors, server success", async () => {
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

  let $editBtn = getDefinitionEdit("a");
  expect(getDefinitionDismiss("a")).toBeNull();
  expect(getDefinitionInput("a")).toBeNull();
  expect(getDefinitionName("a")).not.toBeNull();

  $editBtn.click();

  // editing.unchanged

  expect(getDefinitionEdit("a")).toBeNull();
  expect(getDefinitionInput("a").classList).toContain(
    "definition-input-unchanged",
  );

  let $dismiss = getDefinitionDismiss("a");
  $dismiss.click();

  // back to idle

  expect(getDefinitionDismiss("a")).toBeNull();

  $editBtn = getDefinitionEdit("a");
  $editBtn.click();

  // editing.unchanged

  expect(getDefinitionReset("a")).toBeNull();

  let $input = getDefinitionInput("a");
  fillField($input, "g1");

  // editing.changed
  // we can dismiss

  $dismiss = getDefinitionDismiss("a");
  $dismiss.click();

  // back to idle

  $editBtn = getDefinitionEdit("a");
  $editBtn.click();

  // editing.unchanged
  // we can not reset

  expect(getDefinitionReset("a")).toBeNull();

  fillField(getDefinitionInput("a"), "g1");
  //debug();
  // editing.changed
  // we can reset by clicking reset button

  getDefinitionReset("a").click();
  // editing.unchanged
  expect(getDefinitionInput("a").classList).toContain(
    "definition-input-unchanged",
  );
  expect(getDefinitionInput("a").value).toEqual("f1");
  expect(getDefinitionReset("a")).toBeNull();

  fillField(getDefinitionInput("a"), "g1");

  // editing.changed
  // OR we can reset by changing to default value

  fillField(getDefinitionInput("a"), "f1  ");

  // editing.unchanged

  expect(getDefinitionSubmit("a")).toBeNull();
  expect(getDefinitionReset("a")).toBeNull();
  fillField(getDefinitionInput("a"), "g  ");

  // editing.changed.form

  const $submit = getDefinitionSubmit("a");
  const $field = getDefinitionField("a");

  expect($field.classList).not.toContain("error");

  $submit.click();

  // editing.changed.formErrors

  expect(getDefinitionError("a")).not.toBeNull();
  expect($field.classList).toContain("error");
  fillField(getDefinitionInput("a"), "g1  ");
  expect($field.classList).not.toContain("definition--success");

  $submit.click();
  destroyModal();
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
  expect(getDefinitionName("a").value).toEqual("g1");
});

test("not editing data, editing siblings, server error", async () => {
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

  expect(getDefinitionInput("a")).toBeNull();
  getDefinitionEdit("a").click();

  // a = editing.unchanged
  expect(getDefinitionSubmit("a")).toBeNull();
  fillField(getDefinitionInput("a"), "g1");
  // a = editing.changed
  expect(getDefinitionSubmit("a")).not.toBeNull();

  expect(getDefinitionInput("b")).toBeNull();
  getDefinitionEdit("b").click();
  // b = editing.unchanged
  fillField(getDefinitionInput("b"), "g2");
  // b = editing.changed.editingSiblings
  expect(getDefinitionSubmit("b")).toBeNull();

  // a = editing.changed.editingSiblings.firstEditableSibling
  expect(getDefinitionSubmit("a")).not.toBeNull();

  expect(getDefinitionReset("a")).not.toBeNull();
  fillField(getDefinitionInput("a"), "f1");

  // a = editing.unchanged
  expect(getDefinitionReset("a")).toBeNull();

  // b = editing.changed.notEditingSiblings
  expect(getDefinitionSubmit("b")).not.toBeNull();

  expect(getDefinitionInput("c")).toBeNull();
  getDefinitionEdit("c").click();
  fillField(getDefinitionInput("c"), "g3");
  // c = editing.changed.editingSiblings
  expect(getDefinitionSubmit("c")).toBeNull();
  // b = ediitng.changed.editingSiblings.firstEditableSiblings
  expect(getDefinitionSubmit("b")).not.toBeNull();

  getDefinitionDismiss("b").click();
  // b = idle
  expect(getDefinitionInput("b")).toBeNull();
  // c = editing.changed.notEditingSiblings
  expect(getDefinitionSubmit("c")).not.toBeNull();

  fillField(getDefinitionInput("a"), "g");
  // c = editing.changed.editingSiblings
  expect(getDefinitionSubmit("c")).toBeNull();

  getDefinitionEdit("b").click();
  // b should be unchanged because adding only whitespace does not count
  fillField(getDefinitionInput("b"), "f2     ");
  // b = editing.unchanged
  expect(getDefinitionReset("b")).toBeNull();

  const $fieldA = getDefinitionField("a");
  expect($fieldA.classList).not.toContain("error");

  const $fieldC = getDefinitionField("c");

  // a = editing.changed.editingSiblings.firstEditableSibling
  const $submit = getDefinitionSubmit("a");
  $submit.click();

  // a = editing.changed.form.formErrors
  await wait(() => {
    expect($fieldA.classList).toContain("error");
  });

  expect($fieldC.classList).not.toContain("error");
  expect($fieldA.classList).not.toContain("definition--success");

  fillField(getDefinitionInput("a"), "g1");
  $submit.click();

  await wait(() => {
    expect($fieldA.classList).toContain("definition--success");
  });

  expect($fieldA.classList).not.toContain("error");
  expect($fieldC.classList).toContain("error");
  expect($fieldC.classList).not.toContain("definition--success");
});

test.only("editing data, editing definitions", async () => {
  // NOTE: default date = 2000-01-01, time = 2000-01-01T01:01:01.000Z
  const time = "2000-01-01T01:01:01.000Z";
  const date = "2000-01-01";

  const {
    ui,
    mockUpdateDefinitionsAndDataOnline,
    mockEditEntryUpdate,
  } = makeComp({
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

  mockUpdateDefinitionsAndDataOnline.mockResolvedValue({
    data: {
      updateDefinitions: {
        definitions: [
          {
            definition: {
              id: "int",
            },
          } as UpdateDefinitions_updateDefinitions_definitions,

          {
            errors: {
              id: "dec",

              errors: {
                name: "n",
                definition: "",
              },
            },
          },
        ] as UpdateDefinitions_updateDefinitions_definitions[],
      } as UpdateDefinitions_updateDefinitions,

      updateDataObjects: [
        {
          id: "date",

          dataObject: {
            id: "date",
            data: `{"date":"2000-01-02"}`,
          },
        },

        {
          id: "time",

          dataObject: {
            id: "time",
            data: `{"datetime":"2000-01-02T01:01:01.000Z"}`,
          },
        },

        {
          id: "multi",

          dataObject: {
            id: "multi",
            data: `{"multi_line_text":"mu"}`,
          },
        },

        {
          id: "text",

          stringError: "n",
        } as UpdateDataObjects_updateDataObjects,

        {
          id: "dec",

          fieldErrors: {
            __typename: "DataDefinitionError",
            data: "d",
            definition: "",
          },
        },
      ] as UpdateDataObjects_updateDataObjects[],
    } as UpdateDefinitionAndData,
  });

  const { debug } = render(ui);

  getDefinitionEdit("int").click();
  getDefinitionInput("int", "in");
  // primary state.notEdiitngData
  expect(getDefinitionSubmit("int")).not.toBeNull();

  expect(makeSubmit()).toBeNull();
  const $int = getDataInput("int", "2");
  const $date = getDataInput("date", "2000-01-02");
  // primary state editingData
  expect(getDefinitionSubmit("int")).toBeNull();
  expect(makeSubmit()).not.toBeNull();

  // revert back to int default
  fillField($int, "1");
  expect(makeSubmit()).not.toBeNull();

  // revert back to date default
  fillField($date, date);

  // primary state.notEditingData
  expect(makeSubmit()).toBeNull();
  expect(getDefinitionSubmit("int")).not.toBeNull();

  getDefinitionInput("int", "int");
  // int state.editing.unchanged
  expect(getDefinitionSubmit("int")).toBeNull();

  getDataInput("time", "2000-01-02T01:01:01.000Z");
  // primary.editingData
  expect(makeSubmit()).not.toBeNull();

  getDefinitionInput("int", "n");
  // int definition form errors
  expect(getDefinitionError("int")).toBeNull();

  makeSubmit().click();
  // the overlay will not be rendered exepct while awaiting server response
  // expect(document.getElementById("submitting-overlay")).not.toBeNull();
  let $responseMessage = await waitForElement(getFormErrorsDom);

  expect($responseMessage).not.toBeNull();
  expect(getDefinitionError("int")).not.toBeNull();

  fillField($date, "2000-01-02");
  getDataInput("multi", "mu");
  getDataInput("text", "te");
  getDataInput("dec", "0.9");
  const $fieldDate = getDataField("date");
  expect($fieldDate.classList).not.toContain("data--success");

  const $fieldTime = getDataField("time");
  expect($fieldTime.classList).not.toContain("data--success");

  const $fieldMulti = getDataField("multi");
  expect($fieldMulti.classList).not.toContain("data--success");

  const $fieldText = getDataField("text");
  expect($fieldText.classList).not.toContain("error");
  expect(getDataError("text")).toBeNull();

  const $fieldDec = getDataField("dec");
  expect($fieldDec.classList).not.toContain("error");
  expect(getDataError("dec")).toBeNull();

  getDefinitionInput("int", "in");
  getDefinitionEdit("dec").click();
  getDefinitionInput("dec", "de");
  expect(getDefinitionError("dec")).toBeNull();
  const $fieldInt = getDefinitionField("int");
  expect($fieldInt.classList).not.toContain("definition--success");

  makeSubmit().click();
  // primary.submitting
  expect(document.getElementById("submitting-overlay")).not.toBeNull();

  $responseMessage = await waitForElement(getSubmissionResponseDom);

  const mock = mockUpdateDefinitionsAndDataOnline.mock
    .calls[0][0] as ToVariables<UpdateDefinitionAndDataVariables>;

  expect(mock.variables).toEqual({
    definitionsInput: [
      {
        id: "int",
        name: "in",
      },

      {
        id: "dec",
        name: "de",
      },
    ],

    dataInput: [
      {
        id: "dec",
        data: `{"decimal":"0.9"}`,
      },

      {
        id: "date",
        data: `{"date":"2000-01-02"}`,
      },

      {
        id: "time",
        data: `{"datetime":"2000-01-02T01:01:01.000Z"}`,
      },

      {
        id: "text",
        data: `{"single_line_text":"te"}`,
      },

      {
        id: "multi",
        data: `{"multi_line_text":"mu"}`,
      },
    ],
  } as UpdateDefinitionAndDataVariables);

  expect(mock.update).toBe(mockEditEntryUpdate);

  expect(document.getElementById("submitting-overlay")).toBeNull();

  const submissionResponseMessage = $responseMessage.textContent;
  expect(submissionResponseMessage).toContain("4");
  expect(submissionResponseMessage).toContain("3");

  closeMessage($responseMessage);

  expect(
    document.getElementById("edit-entry-submission-response-message"),
  ).toBeNull();

  expect(getDefinitionError("dec")).not.toBeNull();
  expect($fieldInt.classList).toContain("definition--success");

  expect($fieldDate.classList).toContain("data--success");
  expect($fieldTime.classList).toContain("data--success");
  expect($fieldMulti.classList).toContain("data--success");
  expect(getDataError("date")).toBeNull();

  expect($fieldText.classList).toContain("error");
  expect($fieldText.classList).not.toContain("data--success");
  expect(getDataError("text")).not.toBeNull();

  expect($fieldDec.classList).toContain("error");
  expect($fieldDec.classList).not.toContain("data--success");
  expect(getDataError("dec")).not.toBeNull();

  expect(getDataInput("dec").value).toEqual("0.9");
  expect(getDataInput("date").value).toEqual("2000-01-02T00:00:00.000Z");
  expect(getDataInput("time").value).toEqual("2000-01-02T01:01:01.000Z");
  expect(getDataInput("multi").value).toEqual("mu");


  console.log(JSON.stringify(window.state, null, 2));
});

test("update function", () => {
  expect(editEntryUpdate()).toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const EditEntryP = EditEntry as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const mockUpdateDefinitionsOnline = jest.fn();
  const mockParentDispatch = jest.fn();
  const mockEditEntryUpdate = jest.fn();
  const mockUpdateDefinitionsAndDataOnline = jest.fn();

  return {
    ui: (
      <EditEntryP
        updateDefinitionsOnline={mockUpdateDefinitionsOnline}
        dispatch={mockParentDispatch}
        editEntryUpdate={mockEditEntryUpdate}
        updateDefinitionAndDataOnline={mockUpdateDefinitionsAndDataOnline}
        {...props}
      />
    ),
    mockUpdateDefinitionsOnline,
    mockParentDispatch,
    mockEditEntryUpdate,
    mockUpdateDefinitionsAndDataOnline,
  };
}

function getDefinitionField(id: string, control?: string) {
  return document.getElementById(
    `edit-entry-definition-${id}` + (control ? `-${control}` : ""),
  ) as HTMLInputElement;
}

function getDefinitionReset(id: string) {
  return getDefinitionField(id, "reset");
}

function getDefinitionInput(id: string, val?: string) {
  const $input = getDefinitionField(id, "input");

  if (val) {
    fillField($input, val);
  }

  return $input;
}

function getDefinitionSubmit(id: string) {
  return getDefinitionField(id, "submit");
}

function getDefinitionDismiss(id: string) {
  return getDefinitionField(id, "dismiss");
}

function getDefinitionEdit(id: string) {
  return getDefinitionField(id, "edit-btn");
}

function getDefinitionName(id: string) {
  return getDefinitionField(id, "name");
}

function getDefinitionError(id: string) {
  return getDefinitionField(id, "error");
}

function getDataField(id: string, suffix?: string) {
  return document.getElementById(
    `edit-entry-data-${id}` + (suffix ? `-${suffix}` : ""),
  ) as HTMLInputElement;
}

function getDataInput(id: string, val?: string) {
  const $input = getDataField(id, "input");

  if (val) {
    fillField($input, val);
  }

  return $input;
}

function getDataError(id: string) {
  return getDataField(id, "error");
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
        const date = new Date(val);
        onChange(name, isNaN(date.getTime()) ? "invalid" : date);
      }}
    />
  );

  return comp;
}

function destroyModal() {
  const $element = document.getElementById("edit-entry-modal");
  closeMessage($element);
}

function getSubmissionResponseDom() {
  return document.getElementById(
    "edit-entry-submission-response-message",
  ) as HTMLDivElement;
}

function getFormErrorsDom() {
  return document.getElementById(
    "edit-entry-form-errors-message",
  ) as HTMLDivElement;
}
