/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import { render } from "@testing-library/react";
import {
  SidebarHeader,
  Props,
} from "../components/SidebarHeader/sidebar-header.component";

jest.mock("../components/Header/header.component", () => ({
  Header: jest.fn(() => null),
}));

jest.mock("../components/Sidebar/sidebar.component", () => ({
  Sidebar: jest.fn(() => <div id="yo" />),
}));

const SidebarHeaderP = SidebarHeader as ComponentType<Partial<Props>>;

it("renders no sidebar", () => {
  render(<SidebarHeaderP />);

  expect(document.getElementById("yo")).toBeNull();
});

it("renders sidebar", () => {
  render(<SidebarHeaderP sidebar={true} />);

  expect(document.getElementById("yo")).not.toBeNull();
});
