// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait } from "react-testing-library";

import { Sidebar, Props } from "../components/Sidebar/component";
import { renderWithRouter } from "./test_utils";
import { RouteComponentProps } from "@reach/router";
import {
  EXPERIENCES_URL,
  EXPERIENCE_DEFINITION_URL,
  LOGIN_URL
} from "../routes";

const SidebarP = Sidebar as ComponentType<Partial<Props>>;

it("renders as visible and sidebar item toggles visibility off", () => {
  /**
   * Given that the sidebar is initially visible
   */
  const { ui, mockToggleShowSidebar } = setup({ props: { show: true } });

  const { getByTestId } = render(ui);

  /**
   * Then it must be visible
   */
  const $sidebar = getByTestId("app-sidebar");
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

  const { getByTestId } = render(ui);

  /**
   * Then it must be invisible
   */

  expect(getByTestId("app-sidebar").classList).not.toContain("visible");
});

it("toggles visibility off with hide item", () => {
  /**
   * Given that we are interacting with the sidebar
   */
  const { ui, mockToggleShowSidebar } = setup();

  const { getByTestId } = render(ui);

  /**
   * When we click on the sidebar hide item
   */
  fireEvent.click(getByTestId("sidebar-hide"));

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

  const { getByTestId } = render(ui);

  /**
   * When we click on the container
   */
  fireEvent.click(getByTestId("sidebar-container"));

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
    routeProps: {
      path: EXPERIENCES_URL + "some string"
    }
  });

  const { getByText } = render(ui);

  /**
   * Then we should see the link
   */
  const $link = getByText("My Experiences");
  expect($link).toBeInTheDocument();

  /**
   * When we click on the link
   */
  fireEvent.click($link);

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
    routeProps: {
      path: EXPERIENCE_DEFINITION_URL + "some string"
    }
  });

  const { getByText } = render(ui);

  /**
   * Then we should see the link
   */
  const $link = getByText("New Experience Definition");
  expect($link).toBeInTheDocument();

  /**
   * When we click on the link
   */
  fireEvent.click($link);

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

  const { ui, mockUpdateLocalUser, mockNavigate } = setup({
    props: { user: {} as any }
  });
  /**
   * When we are interacting with the component
   */

  const { getByText } = render(ui);

  /**
   * When we click on log out button
   */
  fireEvent.click(getByText(/log out/i));

  /**
   * Then we should be logged out
   */

  await wait(() => {
    expect((mockUpdateLocalUser.mock.calls[0][0] as any).variables.user).toBe(
      null
    );
  });

  /**
   * And we should be redirected
   */
  expect(mockNavigate).toBeCalledWith(LOGIN_URL);
});

it("does not render logout button if we are not logged in", () => {
  /**
   * Given that user is not logged in
   */

  const { ui } = setup({
    props: { user: null as any }
  });
  /**
   * When we are interacting with the component
   */

  const { queryByText } = render(ui);

  /**
   * Then logout button should not be rendered
   */
  expect(queryByText(/log out/i)).not.toBeInTheDocument();
});

function setup({
  props = {},
  routeProps = {}
}: {
  props?: Partial<Props>;
  routeProps?: Partial<RouteComponentProps>;
} = {}) {
  const mockToggleShowSidebar = jest.fn();
  const mockUpdateLocalUser = jest.fn();

  const { Ui, ...rest } = renderWithRouter(SidebarP, routeProps, {
    toggleShowSidebar: mockToggleShowSidebar,
    updateLocalUser: mockUpdateLocalUser,
    ...props
  });

  return {
    ui: <Ui />,
    ...rest,
    mockToggleShowSidebar,
    mockUpdateLocalUser
  };
}
