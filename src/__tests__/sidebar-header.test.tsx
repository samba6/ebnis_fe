import React from "react";
import "jest-dom/extend-expect";
import { render, fireEvent } from "react-testing-library";

import { SidebarHeader } from "../components/SidebarHeader/sidebar-header";
import { renderWithRouter } from "./test_utils";

const title = "My shinning app";

it("renders with header no sidebar", () => {
  const { container, getByTestId, queryByTestId } = render(
    <SidebarHeader title={title} />
  );

  const sidebarHeader = container.firstChild;
  expect(sidebarHeader).toContainElement(getByTestId("app-header"));
  expect(sidebarHeader).not.toContainElement(queryByTestId("app-sidebar"));
});

it("renders with header and sidebar", () => {
  const { ui } = renderWithRouter(
    <SidebarHeader title={title} sidebar={true} />
  );

  const { container: sidebarHeader, getByTestId, queryByTestId } = render(ui);

  expect(sidebarHeader).toContainElement(getByTestId("app-header"));

  const sidebar = getByTestId("app-sidebar");
  expect(sidebarHeader).toContainElement(sidebar);
  expect(sidebar.classList).not.toContain("visible");

  expect(sidebarHeader).toContainElement(getByTestId("show-sidebar-icon"));
  expect(sidebarHeader).not.toContainElement(
    queryByTestId("close-sidebar-icon")
  );

  const sidebarTrigger = getByTestId("sidebar-trigger");
  fireEvent.click(sidebarTrigger);

  expect(sidebar.classList).toContain("visible");
  expect(sidebarHeader).toContainElement(getByTestId("close-sidebar-icon"));
  expect(sidebarHeader).not.toContainElement(
    queryByTestId("show-sidebar-icon")
  );
});
