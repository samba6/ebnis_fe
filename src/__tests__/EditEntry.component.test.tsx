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
  expect($element).not.toBeNull();

  closeMessage($element);

  expect((mockParentDispatch.mock.calls[0][0] as any).type).toEqual(
    ActionTypes.DESTROYED,
  );
});

test("definitions not editing data", async () => {
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

  const { debug } = render(ui);

  // idle state

  let $editBtn = document.getElementById(
    "edit-entry-definition-a-edit-btn",
  ) as any;

  expect(document.getElementById("edit-entry-definition-a-dismiss")).toBeNull();

  expect(document.getElementById("edit-entry-definition-a-input")).toBeNull();

  expect(
    document.getElementById("edit-entry-definition-a-name"),
  ).not.toBeNull();

  $editBtn.click();

  // pristine state

  expect(
    document.getElementById("edit-entry-definition-a-edit-btn"),
  ).toBeNull();

  expect(document.getElementById("edit-entry-definition-a-name")).toBeNull();

  let $input = document.getElementById("edit-entry-definition-a-input") as any;

  const $dismiss = document.getElementById(
    "edit-entry-definition-a-dismiss",
  ) as any;

  // back to idle
  $dismiss.click();

  expect(document.getElementById("edit-entry-definition-a-dismiss")).toBeNull();

  // dirty state

  $editBtn = document.getElementById("edit-entry-definition-a-edit-btn") as any;
  $editBtn.click();

  $input = document.getElementById("edit-entry-definition-a-input") as any;

  fillField($input, "g1");

  // debug();
  expect(document.getElementById("edit-entry-definition-a-dismiss")).toBeNull();

  // field filled with default value
  fillField($input, "f1");

  // back to pristine

  expect(
    document.getElementById("edit-entry-definition-a-dismiss"),
  ).not.toBeNull();

  // back to dirty

  fillField($input, "g1");

  (document.getElementById("edit-entry-definition-a-submit") as any).click();

  // submitting

  await wait(() => {
    expect(
      (mockUpdateDefinitionsOnline.mock.calls[0][0] as ToInputVariables<
        UpdateDefinitionInput[]
      >).variables.input,
    ).toMatchObject([
      {
        id: "a",
        name: "g1",
      },
    ]);
  });

  // back to idle
  expect(
    (document.getElementById("edit-entry-definition-a") as HTMLElement)
      .classList,
  ).toContain("success");
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
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
