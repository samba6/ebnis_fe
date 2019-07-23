/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import { render } from "react-testing-library";

import { SidebarHeader, Props } from "../components/SidebarHeader/component";

jest.mock("../components/Header", () => ({
  Header: jest.fn(() => null),
}));

jest.mock("../components/Sidebar", () => ({
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
