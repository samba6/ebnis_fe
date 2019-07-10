/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { EditEntry } from "../components/EditEntry/component";

it("renders", () => {
  const { ui } = makeComp({
    props: {},
  });

  const {} = render(ui);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////
const EditEntryP = EditEntry as ComponentType<Partial<{}>>;

function makeComp({ props = {} }: { props?: Partial<{}> } = {}) {
  return {
    ui: <EditEntryP {...props} />,
  };
}
