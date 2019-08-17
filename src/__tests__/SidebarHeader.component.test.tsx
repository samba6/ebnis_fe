/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import { render } from "react-testing-library";

import {
  SidebarHeader,
  Props,
} from "../components/SidebarHeader/sidebar-header.component";

jest.mock("../components/Header/header", () => ({
  Header: jest.fn(() => null),
}));

jest.mock("../components/Sidebar/sidebar", () => ({
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
