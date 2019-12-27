/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render, wait, waitForElement } from "@testing-library/react";
import { EditEntryComponent } from "../components/EditEntry/edit-entry.component";
import { Props, ActionTypes } from "../components/EditEntry/edit-entry-utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import {
  DataTypes,
  UpdateDefinitionInput,
  UpdateDataObjectInput,
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
import {
  UpdateDefinitionAndData,
  UpdateDefinitionAndDataVariables,
} from "../graphql/apollo-types/UpdateDefinitionAndData";
import {
  UpdateDataObjects_updateDataObjects,
  UpdateDataObjects,
} from "../graphql/apollo-types/UpdateDataObjects";
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";
import { toISODatetimeString } from "../components/NewEntry/new-entry.utils";
import { deleteCachedQueriesAndMutationsCleanupFn } from "../components/delete-cached-queries-and-mutations-cleanup";

////////////////////////// MOCKS ////////////////////////////

jest.mock("../components/DateTimeField/date-time-field.component", () => ({
  DateTimeField: MockDateTimeField,
}));

jest.mock("../components/DateField/date-field.component", () => ({
  DateField: MockDateTimeField,
}));

jest.mock("../components/EditEntry/edit-entry.injectables");

jest.mock("../components/delete-cached-queries-and-mutations-cleanup");
const mockDeleteCachedQueriesAndMutationsCleanup = deleteCachedQueriesAndMutationsCleanupFn as jest.Mock;

let errorConsoleSpy: jest.SpyInstance;

beforeAll(() => {
  errorConsoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  errorConsoleSpy.mockReset();
});

beforeEach(() => {
  mockDeleteCachedQueriesAndMutationsCleanup.mockReset();
});

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
            type: DataTypes.INTEGER,
            name: "f1",
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  const { unmount } = render(ui);
  expect(mockDeleteCachedQueriesAndMutationsCleanup).not.toHaveBeenCalled();

  destroyModal();

  expect((mockParentDispatch.mock.calls[0][0] as any).type).toEqual(
    ActionTypes.DESTROYED,
  );

  unmount();
  expect(mockDeleteCachedQueriesAndMutationsCleanup).toHaveBeenCalled();
});

test("not editing data, no siblings, form errors, server success", async () => {
  const { ui, mockUpdateDefinitionsOnline, mockEditEntryUpdate } = makeComp({
    props: {
      entry: {
        dataObjects: [] as DataObjectFragment[],
      } as EntryFragment,

      experience: {
        id: "e",

        dataDefinitions: [
          {
            id: "a",
            type: DataTypes.INTEGER,
            name: "f1",
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
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
  fillField(getDefinitionInput("a"), "g1  "); // will be trimmed on submit

  // editing.changed.form

  const $submit = getDefinitionSubmit("a");
  // invalid server response
  mockUpdateDefinitionsOnline.mockResolvedValue({
    data: {} as UpdateDefinitions,
  });

  expect(getSubmittingOverlay()).toBeNull();
  $submit.click();
  expect(getSubmittingOverlay()).not.toBeNull();
  await waitForElement(getSubmissionSuccessResponseDom);

  const mock = mockUpdateDefinitionsOnline.mock.calls[0][0] as ToInputVariables<
    UpdateDefinitionInput[]
  >;

  expect(mock.variables.input).toMatchObject({
    experienceId: "e",

    definitions: [
      {
        id: "a",
        name: "g1",
      },
    ],
  });

  expect(mock.update).toBe(mockEditEntryUpdate);

  // let's try to submit again so we get another type of invalid server
  // response
  mockUpdateDefinitionsOnline.mockResolvedValue({
    data: {
      updateDefinitions: {},
    } as UpdateDefinitions,
  });

  $submit.click();
  await waitForElement(getSubmissionSuccessResponseDom);

  // yet another unexpected server response
  mockUpdateDefinitionsOnline.mockResolvedValue({});
  $submit.click();
  await waitForElement(getOtherErrorsResponseDom);

  // we submit again
  /** will error cos less than 2 chars **/ fillField(
    getDefinitionInput("a"),
    "g  ",
  );
  const $field = getDefinitionField("a");
  expect($field.classList).not.toContain("error");
  $submit.click();
  // editing.changed.formErrors
  expect(getDefinitionError("a")).not.toBeNull();
  expect($field.classList).toContain("error");
  // leading and trailing white space don't count towards char lenght
  fillField(getDefinitionInput("a"), "g1  ");
  expect($field.classList).not.toContain("definition--success");

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

  $submit.click();
  destroyModal();
  expect(getSubmittingOverlay()).not.toBeNull();
  // submitting
  await waitForElement(getSubmissionSuccessResponseDom);

  // back to idle, with success
  expect($field.classList).toContain("definition--success");
  expect($field.classList).not.toContain("error");
  expect(getSubmittingOverlay()).toBeNull();
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
            type: DataTypes.INTEGER,
            name: "f1",
          },

          {
            id: "b",
            type: DataTypes.DECIMAL,
            name: "f2",
          },

          {
            id: "c",
            type: DataTypes.INTEGER,
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

test("editing data, editing definitions", async () => {
  const serverResponse = {
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
  } as UpdateDefinitionAndData;

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
        id: "ex",

        dataDefinitions: [
          {
            id: "int",
            type: DataTypes.INTEGER,
            name: "int",
          },

          {
            id: "dec",
            type: DataTypes.DECIMAL,
            name: "dec",
          },

          {
            id: "date",
            type: DataTypes.DATE,
            name: "date",
          },

          {
            id: "time",
            type: DataTypes.DATETIME,
            name: "time",
          },

          {
            id: "text",
            type: DataTypes.SINGLE_LINE_TEXT,
            name: "text",
          },

          {
            id: "multi",
            type: DataTypes.MULTI_LINE_TEXT,
            name: "multi",
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  render(ui);

  getDefinitionEdit("int").click();
  getDefinitionInput("int", "in");
  // primary state.notEdiitngData
  expect(getDefinitionSubmit("int")).not.toBeNull();

  expect(getSubmit()).toBeNull();
  const $int = getDataInput("int", "2");
  const $date = getDataInput("date", "2000-01-02");
  // primary state editingData
  expect(getDefinitionSubmit("int")).toBeNull();
  expect(getSubmit()).not.toBeNull();

  // revert back to int default
  fillField($int, "1");
  expect(getSubmit()).not.toBeNull();

  // revert back to date default
  fillField($date, date);

  // primary state.notEditingData
  expect(getSubmit()).toBeNull();
  expect(getDefinitionSubmit("int")).not.toBeNull();

  getDefinitionInput("int", "int");
  // int state.editing.unchanged
  expect(getDefinitionSubmit("int")).toBeNull();

  getDataInput("time", "2000-01-02T01:01:01.000Z");
  // primary.editingData
  const $submit = getSubmit();

  fillField($date, "2000-01-02");
  getDataInput("multi", "mu");
  getDataInput("text", "te");
  getDataInput("dec", "0.9");
  const $fieldDate = getDataField("date");
  const $fieldTime = getDataField("time");
  const $fieldMulti = getDataField("multi");
  const $fieldText = getDataField("text");
  const $fieldDec = getDataField("dec");
  getDefinitionInput("int", "in");
  getDefinitionEdit("dec").click();
  getDefinitionInput("dec", "de");

  // let's simulate an unexpected server response
  mockUpdateDefinitionsAndDataOnline.mockResolvedValue({});
  expect(getOtherErrorsResponseDom()).toBeNull();
  $submit.click();
  await waitForElement(getOtherErrorsResponseDom);

  const $fieldInt = getDefinitionField("int");
  expect(getDefinitionError("dec")).toBeNull();
  expect(getDataError("dec")).toBeNull();
  expect($fieldDate.classList).not.toContain("data--success");
  expect($fieldTime.classList).not.toContain("data--success");
  expect($fieldInt.classList).not.toContain("definition--success");
  expect($fieldMulti.classList).not.toContain("data--success");
  expect($fieldDec.classList).not.toContain("error");
  expect($fieldText.classList).not.toContain("error");
  expect(getDataError("text")).toBeNull();

  // let's simulate form error
  getDefinitionInput("int", "n"); // should be at least one char
  // int definition form errors
  expect(getDefinitionError("int")).toBeNull();
  $submit.click();
  // the overlay will not be rendered except while awaiting server response
  // expect(document.getElementById("submitting-overlay")).not.toBeNull();
  let $responseMessage = await waitForElement(getFormErrorsResponseDom);

  expect($responseMessage).not.toBeNull();
  expect(getDefinitionError("int")).not.toBeNull();
  closeMessage($responseMessage);
  expect(getFormErrorsResponseDom()).toBeNull();

  // we give the right input now, so no form error
  getDefinitionInput("int", "in");

  mockUpdateDefinitionsAndDataOnline.mockResolvedValue({
    data: serverResponse,
  });

  $submit.click();
  // primary.submitting
  expect(getSubmittingOverlay()).not.toBeNull();

  $responseMessage = await waitForElement(getSubmissionSuccessResponseDom);

  const mock = mockUpdateDefinitionsAndDataOnline.mock
    .calls[0][0] as ToVariables<UpdateDefinitionAndDataVariables>;

  expect(mock.variables).toEqual({
    definitionsInput: {
      experienceId: "ex",

      definitions: [
        {
          id: "int",
          name: "in",
        },

        {
          id: "dec",
          name: "de",
        },
      ],
    },

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

        data: `{"datetime":"${toISODatetimeString(
          "2000-01-02T01:01:01.000Z",
        )}"}`,
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

  expect(getSubmittingOverlay()).toBeNull();

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
  expect(getDataInput("date").value).toEqual("2000-01-02T00:00:00+01:00");
  expect(getDataInput("time").value).toEqual("2000-01-02T02:01:01+01:00");
  expect(getDataInput("multi").value).toEqual("mu");
});

test("renders error boundary", () => {
  const { ui, mockParentDispatch } = makeComp({
    props: {
      entry: {
        dataObjects: [
          {
            id: "int",
            definitionId: "int",
            data: `{"integer":1}`,
          },
        ],
      } as EntryFragment,

      experience: {
        dataDefinitions: [] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  render(ui);

  expect(document.getElementById("edit-entry-error-fallback")).not.toBeNull();
  closeMessage(document.getElementById("edit-entry-modal"));
  expect(mockParentDispatch).toHaveBeenCalled();
});

test("submitting only data objects, apollo errors, runtime errors", async () => {
  const { ui, mockUpdateDataOnline, mockEditEntryUpdate } = makeComp({
    props: {
      entry: {
        dataObjects: [
          {
            id: "int",
            definitionId: "int",
            data: `{"integer":1}`,
          },
        ],
      } as EntryFragment,

      experience: {
        dataDefinitions: [
          {
            id: "int",
            name: "int",
            type: DataTypes.INTEGER,
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  render(ui);
  getDataInput("int", "5");

  // we received empty data
  mockUpdateDataOnline.mockResolvedValue({
    data: {},
  });

  const $submit = getSubmit();
  expect(getSubmittingOverlay()).toBeNull();
  $submit.click();
  expect(getSubmittingOverlay()).not.toBeNull();

  let $response = await waitForElement(getSubmissionSuccessResponseDom);

  const mock = mockUpdateDataOnline.mock.calls[0][0] as ToInputVariables<
    UpdateDataObjectInput
  >;
  expect(mock.update).toBe(mockEditEntryUpdate);

  expect(mock.variables.input).toMatchObject([
    {
      id: "int",
      data: `{"integer":"5"}`,
    },
  ]);

  closeMessage($response);
  expect(getSubmissionSuccessResponseDom()).toBeNull();

  // another type of empty response from server.
  mockUpdateDataOnline.mockResolvedValue({});
  expect(getSubmittingOverlay()).toBeNull();
  $submit.click();
  expect(getSubmittingOverlay()).not.toBeNull();
  $response = await waitForElement(getOtherErrorsResponseDom);
  expect(getSubmittingOverlay()).toBeNull();

  // graphQLErrors
  mockUpdateDataOnline.mockRejectedValue(
    new ApolloError({
      graphQLErrors: [new GraphQLError("holla")],
    }),
  );

  expect(getApolloErrorsResponseDom()).toBeNull();
  $submit.click();
  $response = await waitForElement(getApolloErrorsResponseDom);
  expect($response).not.toBeNull();
  closeMessage($response);

  //newtork errors
  expect(getApolloErrorsResponseDom()).toBeNull();
  mockUpdateDataOnline.mockRejectedValue(
    new ApolloError({
      networkError: new Error("a"),
    }),
  );

  $submit.click();
  await waitForElement(getApolloErrorsResponseDom);

  //javascript exceptions apart from apollo errors
  expect(getOtherErrorsResponseDom()).toBeNull();
  mockUpdateDataOnline.mockRejectedValue(new Error("t"));
  $submit.click();
  await waitForElement(getOtherErrorsResponseDom);

  // we received success
  mockUpdateDataOnline.mockResolvedValue({
    data: {
      updateDataObjects: [
        {
          id: "int",
          dataObject: {
            id: "int",
            data: `{"int":10}`,
          },
        },
      ],
    } as UpdateDataObjects,
  });

  $submit.click();

  /**
   * Then the submit response UI should be visible
   */
  await waitForElement(getSubmissionSuccessResponseDom);

  /**
   * And global submit button should not be visible
   */
  expect(getSubmit()).toBeNull();

  /**
   * When we enter a new value for the int field
   */
  getDataInput("int", "500");

  /**
   * Then global submit button should be visible again
   */

  expect(getSubmit()).not.toBeNull();
});

test("not editing data apollo errors", async () => {
  const { ui, mockUpdateDefinitionsOnline } = makeComp({
    props: {
      entry: {
        dataObjects: [] as DataObjectFragment[],
      } as EntryFragment,

      experience: {
        dataDefinitions: [
          {
            id: "a",
            type: DataTypes.INTEGER,
            name: "f1",
          },
        ] as DataDefinitionFragment[],
      } as ExperienceFragment,
    },
  });

  mockUpdateDefinitionsOnline.mockRejectedValue(
    new ApolloError({
      networkError: new Error("a"),
    }),
  );

  render(ui);
  getDefinitionEdit("a").click();
  getDefinitionInput("a", "g1");
  expect(getApolloErrorsResponseDom()).toBeNull();
  getDefinitionSubmit("a").click();
  const $response = await waitForElement(getApolloErrorsResponseDom);
  expect($response).not.toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const EditEntryP = EditEntryComponent as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const mockUpdateDefinitionsOnline = jest.fn();
  const mockParentDispatch = jest.fn();
  const mockUpdateDefinitionsAndDataOnline = jest.fn();
  const mockUpdateDataOnline = jest.fn();
  const mockEditEntryUpdate = jest.fn();

  return {
    ui: (
      <EditEntryP
        updateDefinitionsOnline={mockUpdateDefinitionsOnline}
        updateDataObjectsOnline={mockUpdateDataOnline}
        updateDefinitionsAndDataOnline={mockUpdateDefinitionsAndDataOnline}
        editEntryUpdateProp={mockEditEntryUpdate}
        dispatch={mockParentDispatch}
        {...props}
      />
    ),
    mockUpdateDefinitionsOnline,
    mockParentDispatch,
    mockUpdateDefinitionsAndDataOnline,
    mockUpdateDataOnline,
    mockEditEntryUpdate,
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

function getSubmit() {
  return document.getElementById("edit-entry-submit") as HTMLButtonElement;
}

function MockDateTimeField(props: DateTimeProps) {
  const { value, name, onChange } = props;

  const comp = (
    <input
      value={toISODatetimeString(value as Date)}
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

function getSubmissionSuccessResponseDom() {
  return document.getElementById(
    "edit-entry-submission-response-message",
  ) as HTMLDivElement;
}

function getFormErrorsResponseDom() {
  return document.getElementById(
    "edit-entry-form-errors-message",
  ) as HTMLDivElement;
}

function getSubmittingOverlay() {
  return document.getElementById("submitting-overlay");
}

function getOtherErrorsResponseDom() {
  return document.getElementById(
    "edit-entry-other-errors-message",
  ) as HTMLDivElement;
}

function getApolloErrorsResponseDom() {
  return document.getElementById(
    "edit-entry-apollo-errors-message",
  ) as HTMLDivElement;
}
