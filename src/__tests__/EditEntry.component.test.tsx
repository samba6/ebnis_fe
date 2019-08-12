// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { EditEntry } from "../components/EditEntry/component";
import { Props } from "../components/EditEntry/utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import { FieldType } from "../graphql/apollo-types/globalTypes";

const EditEntryP = EditEntry as ComponentType<Partial<Props>>;

test("definitions not editing data", () => {
  const { ui } = makeComp({
    props: {
      entry: {} as EntryFragment,
      definitions: [
        {
          id: "a",
          type: FieldType.INTEGER,
          name: "f1",
        },
      ] as DataDefinitionFragment[],
    },
  });

  const {} = render(ui);

  // idle state

  const $editBtn = document.getElementById(
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

  expect(
    document.getElementById("edit-entry-definition-a-dismiss"),
  ).not.toBeNull();

  expect(document.getElementById("edit-entry-definition-a-name")).toBeNull();

  expect(
    document.getElementById("edit-entry-definition-a-input"),
  ).not.toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <EditEntryP {...props} />,
  };
}
