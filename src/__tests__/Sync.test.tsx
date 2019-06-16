// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { Sync } from "../components/Sync/component";
import { Props } from "../components/Sync/utils";

const SyncP = Sync as ComponentType<Partial<Props>>;

it("renders", () => {
  const { ui } = makeComp({
    props: {}
  });

  const {} = render(ui);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <SyncP {...props} />
  };
}
