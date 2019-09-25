/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render, fireEvent } from "@testing-library/react";
import { Sidebar, Props } from "../components/Sidebar/sidebar.component";
import { RouteComponentProps } from "@reach/router";
import {
  EXPERIENCES_URL,
  EXPERIENCE_DEFINITION_URL,
  LOGIN_URL,
} from "../routes";
import { useUser } from "../components/use-user";
import { LocationProvider } from "../components/Layout/layout-providers";

jest.mock("../components/use-user");
jest.mock("../state/users");

const mockUseUser = useUser as jest.Mock;

it("renders as visible and sidebar item toggles visibility off", () => {
  /**
   * Given that the sidebar is initially visible
   */
  const { ui, mockToggleShowSidebar } = setup({ props: { show: true } });

  render(ui);

  /**
   * Then it must be visible
   */
  const $sidebar = document.getElementById("app-sidebar") as any;
  expect($sidebar.classList).toContain("visible");

  /**
   * When we click on any item inside the sidebar
   */
  fireEvent.click($sidebar);

  /**
   * Then the sidebar should become invisible
   */
  expect(mockToggleShowSidebar.mock.calls[0][0]).toBe(false);
});

it("renders as invisible", () => {
  /**
   * Given that the sidebar is initially invisible
   */
  const { ui } = setup({ props: { show: false } });

  render(ui);

  /**
   * Then it must be invisible
   */

  expect(
    (document.getElementById("app-sidebar") as any).classList,
  ).not.toContain("visible");
});

it("toggles visibility off with hide item", () => {
  /**
   * Given that we are interacting with the sidebar
   */
  const { ui, mockToggleShowSidebar } = setup();

  render(ui);

  /**
   * When we click on the sidebar hide item
   */
  fireEvent.click(document.getElementById("sidebar-hide") as any);

  /**
   * Then the sidebar should become invisible
   */
  expect(mockToggleShowSidebar.mock.calls[0][0]).toBe(false);
});

it("does not hide sidebar when we click on the container", () => {
  /**
   * Given that we are interacting with the sidebar
   */
  const { ui, mockToggleShowSidebar } = setup();

  render(ui);

  /**
   * When we click on the container
   */
  fireEvent.click(document.getElementById("sidebar-container") as any);

  /**
   * Then the sidebar should not be hidden
   */
  expect(mockToggleShowSidebar).not.toBeCalled();
});

it("renders my experiences link when not in my experiences route", () => {
  /**
   * Given that we are not in my experiences route
   */
  const { ui, mockNavigate, mockToggleShowSidebar } = setup({
    location: {
      path: EXPERIENCES_URL + "some string",
    },
  });

  render(ui);

  /**
   * When we click on the link
   */
  fireEvent.click(document.getElementById(
    "side-bar-my-experiences-link",
  ) as any);

  /**
   * Then we should be redirected to my experiences route
   */
  expect(mockNavigate).toBeCalledWith(EXPERIENCES_URL);

  /**
   * And the sidebar should become invisible
   */
  expect(mockToggleShowSidebar.mock.calls[0][0]).toBe(false);
});

it("renders 'New Experience Definition' link when not in 'New Experience Definition' route", () => {
  /**
   * Given that we are not in New Experience Definition route
   */
  const { ui, mockNavigate, mockToggleShowSidebar } = setup({
    location: {
      path: EXPERIENCE_DEFINITION_URL + "some string",
    },
  });

  render(ui);

  /**
   * When we click on the link
   */
  fireEvent.click(document.getElementById(
    "sidebar-new-experience-definition-link",
  ) as any);

  /**
   * Then we should be redirected to New Experience Definition route
   */
  expect(mockNavigate).toBeCalledWith(EXPERIENCE_DEFINITION_URL);

  /**
   * And the sidebar should become invisible
   */
  expect(mockToggleShowSidebar.mock.calls[0][0]).toBe(false);
});

it("logs out user", async () => {
  /**
   * Given that user is logged in
   */

  const { ui, mockNavigate } = setup({});
  mockUseUser.mockReturnValue({});
  /**
   * When we are interacting with the component
   */

  render(ui);

  /**
   * When we click on log out button
   */
  fireEvent.click(document.getElementById("sidebar-logout-link") as any);

  /**
   * Then we should be redirected
   */
  expect(mockNavigate).toBeCalledWith(LOGIN_URL);
});

it("does not render logout button if we are not logged in", () => {
  /**
   * Given that user is not logged in
   */

  const { ui } = setup({});
  /**
   * When we are interacting with the component
   */

  render(ui);

  /**
   * Then logout button should not be rendered
   */
  expect(document.getElementById("sidebar-logout-link")).toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const SidebarP = Sidebar as ComponentType<Partial<Props>>;

function setup(args: Args = {}) {
  mockUseUser.mockReset();
  const mockToggleShowSidebar = jest.fn();

  const props = args.props || {};

  const mockNavigate = jest.fn();
  const location = {
    pathname: "",
    ...(args.location || {}),
    navigate: mockNavigate,
  };

  return {
    ui: (
      <LocationProvider value={location as any}>
        <SidebarP toggleShowSidebar={mockToggleShowSidebar} {...props} />
      </LocationProvider>
    ),
    mockToggleShowSidebar,
    mockNavigate,
  };
}

interface Args {
  props?: Partial<Props>;
  location?: Partial<RouteComponentProps>;
}
