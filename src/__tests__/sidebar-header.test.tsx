// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import { render } from "react-testing-library";

import { SidebarHeader, Props } from "../components/SidebarHeader/component";

jest.mock("../components/Header", () => ({
  Header: jest.fn(() => null)
}));

jest.mock("../components/Sidebar", () => ({
  Sidebar: jest.fn(props => <div {...props}>side bar side</div>)
}));

const SidebarHeaderP = SidebarHeader as ComponentType<Partial<Props>>;

it("renders no sidebar", () => {
  const { queryByText } = render(<SidebarHeaderP />);

  expect(queryByText("side bar side")).not.toBeInTheDocument();
});

it("renders sidebar", () => {
  const { getByText } = render(<SidebarHeaderP sidebar={true} />);

  expect(getByText("side bar side")).toBeInTheDocument();
});
