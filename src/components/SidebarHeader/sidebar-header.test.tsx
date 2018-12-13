import React from "react";
import "jest-dom/extend-expect";
import { render, fireEvent } from "react-testing-library";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";

import { SidebarHeader } from "./sidebar-header";

function renderWithRouter(
  ui: JSX.Element,
  {
    route = "/",
    history = createMemoryHistory({ initialEntries: [route] })
  } = {}
) {
  return {
    ...render(<Router history={history}>{ui}</Router>),
    // adding `history` to the returned utilities to allow us
    // to reference it in our tests (just try to avoid using
    // this to test implementation details).
    history
  };
}

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
  const {
    container: sidebarHeader,
    getByTestId,
    queryByTestId
  } = renderWithRouter(<SidebarHeader title={title} sidebar={true} />);

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
