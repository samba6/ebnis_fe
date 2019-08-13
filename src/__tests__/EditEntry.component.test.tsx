// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, waitForElement } from "react-testing-library";
import { EditEntry } from "../components/EditEntry/component";
import { Props } from "../components/EditEntry/utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import { FieldType } from "../graphql/apollo-types/globalTypes";
import { fillField } from "./test_utils";

const EditEntryP = EditEntry as ComponentType<Partial<Props>>;

test("definitions not editing data", async () => {
  const { ui } = makeComp({
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

  fillField($input, "f2");

  // debug();
  expect(document.getElementById("edit-entry-definition-a-dismiss")).toBeNull();

  // field filled with default value
  fillField($input, "f1");

  // back to pristine

  expect(
    document.getElementById("edit-entry-definition-a-dismiss"),
  ).not.toBeNull();

  // back to dirty

  fillField($input, "f2");

  (document.getElementById("edit-entry-definition-a-submit") as any).click();

  // submitting state

  // idle.editSuccess
  await waitForElement(() => {
    return document.getElementById("edit-entry-submitting");
  });
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <EditEntryP {...props} />,
  };
}
