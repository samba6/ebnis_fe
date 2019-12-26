/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import { Page404 } from "../components/Page404/index";

jest.mock("../components/SidebarHeader/sidebar-header.component", () => ({
  SidebarHeader: jest.fn(() => null),
}));

it("renders correctly", () => {
  const { ui } = makeComp({
    props: {},
  });

  const {} = render(ui);
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////
const Page404P = Page404 as ComponentType<Partial<{}>>;

function makeComp({ props = {} }: { props?: Partial<{}> } = {}) {
  return {
    ui: <Page404P {...props} />,
  };
}
