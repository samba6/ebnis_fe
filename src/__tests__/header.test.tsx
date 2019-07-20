/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import { render, fireEvent } from "react-testing-library";
import { Header } from "../components/Header/component";
import { Props } from "../components/Header/utils";
import { renderWithRouter } from "./test_utils";
import { EXPERIENCES_URL, ROOT_URL } from "../routes";
import { ILayoutContextContext } from "../components/Layout/utils";
import { UPLOAD_UNSAVED_PREVIEW_URL } from "../constants/upload-unsaved-routes";
import { LayoutProvider } from "../components/Layout/layout-provider";

jest.mock("../components/use-user");

import { useUser } from "../components/use-user";

const mockUseUser = useUser as jest.Mock;

const title = "My App title";

it("renders sidebar", () => {
  const { ui } = setup({ props: { title, sidebar: true } });

  /**
   * Given we are using header component
   */
  const { getByTestId } = render(ui);

  /**
   * Then header should contain the sidebar trigger UI
   */
  expect(getByTestId("sidebar-trigger")).toBeInTheDocument();

  /**
   * And the logo should not be centered
   */
  expect(getByTestId("logo-container").classList).not.toContain(
    "center-children",
  );

  /**
   * And app title should reflect that we are showing sidebar
   */
});

it("does not render sidebar", () => {
  const { ui } = setup({ props: { title } });

  /**
   * Given we are using header component
   */
  const { queryByTestId, getByTestId } = render(ui);

  /**
   * Then header should not render sidebar trigger UI
   */
  expect(queryByTestId("sidebar-trigger")).not.toBeInTheDocument();

  /**
   * And the logo should be centered
   */
  expect(getByTestId("logo-container").classList).toContain("center-children");
});

it("should not navigate when in experiences route", () => {
  /**
   * Given we are on experiences route
   */
  const { ui, mockNavigate } = setup({
    props: {
      title,
      sidebar: true,
      location: { pathname: EXPERIENCES_URL } as any,
    },
  });

  /**
   * And we are using header component
   */
  const { getByTestId } = render(ui);

  /**
   * Then the logo should not have a pointer
   */
  const $logo = getByTestId("logo-container");
  expect($logo.classList).not.toContain("with-pointer");

  /**
   * When we click on the logo
   */
  fireEvent.click($logo);

  /**
   * Then we should not be navigated away
   */
  expect(mockNavigate).not.toHaveBeenCalled();
});

it("should not navigate when in root route", () => {
  /**
   * Given we are on ROOT route
   */
  const { ui, mockNavigate } = setup({
    props: {
      title,
      sidebar: true,
      location: { pathname: ROOT_URL } as any,
    },
  });

  /**
   * And we are using header component
   */
  const { getByTestId } = render(ui);

  /**
   * Then the logo should not have a pointer
   */
  const $logo = getByTestId("logo-container");
  expect($logo.classList).not.toContain("with-pointer");

  /**
   * When we click on the logo
   */
  fireEvent.click($logo);

  /**
   * Then we should not be navigated away
   */
  expect(mockNavigate).not.toHaveBeenCalled();
});

it("should navigate to experiences route when on any url except root and experiences routes and we are logged in", () => {
  /**
   * Given we are logged in and are on a route except ROOT and experiences
   */
  const { ui, mockNavigate } = setup({
    props: {
      title,
      sidebar: true,
      location: { pathname: ROOT_URL + 5 } as any,
    },
  });

  mockUseUser.mockReturnValue({});

  /**
   * And we are using header component
   */
  const { getByTestId } = render(ui);

  /**
   * Then the logo should have a pointer
   */
  const $logo = getByTestId("logo-container");
  expect($logo.classList).toContain("with-pointer");

  /**
   * When we click on the logo
   */
  fireEvent.click($logo);

  /**
   * Then we should be navigated away to experiences url
   */
  expect(mockNavigate).toHaveBeenCalledWith(EXPERIENCES_URL);
});

it("should navigate to root route when on any url except root and experiences routes and we are not logged in", () => {
  /**
   * Given we are not logged in and are on a route except ROOT and experiences
   */
  const { ui, mockNavigate } = setup({
    props: {
      title,
      sidebar: true,
      location: { pathname: ROOT_URL + 5 } as any,
    },
  });

  /**
   * And we are using header component
   */
  const { getByTestId } = render(ui);

  /**
   * When we click on the logo
   */
  fireEvent.click(getByTestId("logo-container"));

  /**
   * Then we should be navigated away to root url
   */
  expect(mockNavigate).toHaveBeenCalledWith(ROOT_URL);
});

it("renders close sidebar icon but not show icon", () => {
  /**
   * Given we are using header component and we are showing sidebar
   */
  const mockToggleShowSidebar = jest.fn();
  const { ui } = setup({
    props: {
      title,
      sidebar: true,
      toggleShowSidebar: mockToggleShowSidebar,
      show: true,
    },
  });

  const { getByTestId, queryByTestId } = render(ui);

  /**
   * Then show sidebar icon should not be visible
   */

  expect(queryByTestId("show-sidebar-icon")).not.toBeInTheDocument();

  /**
   * And close sidebar icon should be visible
   */
  const $close = getByTestId("close-sidebar-icon");
  expect($close).toBeInTheDocument();

  /**
   * When we click the close icon
   */
  fireEvent.click($close);

  /**
   * Then sidebar should be toggled close
   */
  expect(mockToggleShowSidebar).toHaveBeenCalledWith(false);
});

it("renders show sidebar icon but not close icon", () => {
  /**
   * Given we are using header component and we are showing sidebar
   */
  const mockToggleShowSidebar = jest.fn();
  const { ui } = setup({
    props: {
      title,
      sidebar: true,
      toggleShowSidebar: mockToggleShowSidebar,
      show: false,
    },
  });

  const { getByTestId, queryByTestId } = render(ui);

  /**
   * Then show sidebar icon should be visible
   */

  const $show = getByTestId("show-sidebar-icon");
  expect($show).toBeInTheDocument();

  /**
   * And close sidebar icon should not be visible
   */
  expect(queryByTestId("close-sidebar-icon")).not.toBeInTheDocument();

  /**
   * When we click on the show icon
   */
  fireEvent.click($show);

  /**
   * Then sidebar should be toggled open
   */
  expect(mockToggleShowSidebar).toBeCalledWith(true);

  expect(queryByTestId("unsaved-count-label")).not.toBeInTheDocument();
});

it("renders unsaved count when not in 'upload unsaved' route", () => {
  const { ui } = setup({
    context: {
      unsavedCount: 1,
    },
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("unsaved-count-label")).toBeInTheDocument();
});

it("does not render unsaved count in 'upload unsaved' route", () => {
  const { ui } = setup({
    context: {
      unsavedCount: 1,
    },

    props: {
      location: { pathname: UPLOAD_UNSAVED_PREVIEW_URL } as any,
    },
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("unsaved-count-label")).not.toBeInTheDocument();
});

it("does not render title when there is none to render", () => {
  const { ui } = setup({
    props: {
      title: "",
    },
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("app-header-title")).not.toBeInTheDocument();
});

it("renders children", () => {
  const { ui } = setup({
    props: {
      title: "",
      children: <div data-testid="child" />,
    },
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("app-header-title")).not.toBeInTheDocument();
  expect(queryByTestId("child")).toBeInTheDocument();
});

it("renders only title if there are title and children", () => {
  const { ui } = setup({
    props: {
      title: "cool title",
      children: <div data-testid="child" />,
    },
  });

  const { queryByTestId } = render(ui);

  expect(queryByTestId("app-header-title")).toBeInTheDocument();
  expect(queryByTestId("child")).not.toBeInTheDocument();
});

it("sets class name", () => {
  const { ui } = setup({
    props: {
      className: "yahoo",
    },
  });

  const {
    container: { firstChild },
  } = render(ui);

  expect((firstChild as any).classList).toContain("yahoo");
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const HeaderP = Header as ComponentType<Partial<Props>>;

function setup({
  props = {},
  context = {},
}: { props?: Partial<Props>; context?: Partial<ILayoutContextContext> } = {}) {
  mockUseUser.mockReset();

  const { Ui, ...rest } = renderWithRouter(
    HeaderP,
    {},

    { logoAttrs: {} as any, ...props },
  );

  return {
    ui: (
      <LayoutProvider value={context as any}>
        <Ui />
      </LayoutProvider>
    ),
    ...rest,
  };
}
