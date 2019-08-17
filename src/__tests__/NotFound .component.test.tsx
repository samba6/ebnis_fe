// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { NotFound, Props } from "../components/NotFound";

jest.mock("../components/Page404", () => ({
  Page404: () => null,
}));

const NotFoundP = NotFound as ComponentType<Partial<Props>>;

it("renders", () => {
  const { ui } = makeComp({
    props: {},
  });

  const {} = render(ui);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <NotFoundP {...props} />,
  };
}
