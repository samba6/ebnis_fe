/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import { NotFound, Props } from "../components/NotFound";

jest.mock("../components/Page404", () => ({
  Page404: () => <div id="mocked-page-404" />,
}));

it("renders page 404", () => {
  const { ui } = makeComp();

  const {} = render(ui);

  expect(document.getElementById("mocked-page-404")).not.toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

const NotFoundP = NotFound as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <NotFoundP {...props} />,
  };
}
