// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { EditEntry } from "../components/EditEntry/component";
import { Props, FormValues } from ".../components/EditEntry/utils";
import { EntryFragment } from "../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import { FieldType } from "../graphql/apollo-types/globalTypes";

const EditEntryP = EditEntry as ComponentType<Partial<Props>>;

it("renders form", () => {
  const { ui } = makeComp({
    props: {
      entry: {} as EntryFragment,
      definitions: [
        {
          id: "a",
          type: FieldType.INTEGER,
          name: "f1",
        },
      ],
    } as FormValues,
  });

  const {} = render(ui);

  const $form = document.getElementsByClassName("form");
  expect($form[0]).toBeDefined();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <EditEntryP {...props} />,
  };
}
