// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { Page404 } from "../components/Page404/index";

jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: () => null,
}));

const Page404P = Page404 as ComponentType<Partial<{}>>;

it("renders correctly", () => {
  const { ui } = makeComp({
    props: {},
  });

  const {} = render(ui);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

function makeComp({ props = {} }: { props?: Partial<{}> } = {}) {
  return {
    ui: <Page404P {...props} />,
  };
}
