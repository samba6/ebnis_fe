// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import { render, fireEvent } from "react-testing-library";

import { Header } from "../components/Header/component";
import { Props } from "../components/Header/utils";
import { renderWithRouter } from "./test_utils";
import { EXPERIENCES_URL, ROOT_URL } from "../routes";

type P = ComponentType<Partial<Props>>;
const HeaderP = Header as P;

const title = "My App title";

it("renders sidebar", () => {
  const { ui } = setup({ title, sidebar: true });

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
    "center-children"
  );

  /**
   * And app title should reflect that we are showing sidebar
   */
});

it("does not render sidebar", () => {
  const { ui } = setup({ title });

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
  const { ui, mockNavigate } = setup({
    title,
    sidebar: true,
    location: { pathname: EXPERIENCES_URL } as any
  });

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
  const { ui, mockNavigate } = setup({
    title,
    sidebar: true,
    location: { pathname: ROOT_URL } as any
  });

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
  const { ui, mockNavigate } = setup({
    title,
    sidebar: true,
    location: { pathname: ROOT_URL + 5 } as any,
    user: {} as any
  });

  const { getByTestId } = render(ui);

  /**
   * Then the logo should not have a pointer
   */
  const $logo = getByTestId("logo-container");
  expect($logo.classList).toContain("with-pointer");

  /**
   * When we click on the logo
   */
  fireEvent.click($logo);

  /**
   * Then we should be navigated away to root url
   */
  expect(mockNavigate).toHaveBeenCalledWith(EXPERIENCES_URL);
});

it("should navigate to root route when on any url except root and experiences routes and we are not logged in", () => {
  const { ui, mockNavigate } = setup({
    title,
    sidebar: true,
    location: { pathname: ROOT_URL + 5 } as any,
    user: undefined
  });

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
  const mockToggleShowSidebar = jest.fn();
  const { ui } = setup({
    title,
    sidebar: true,
    toggleShowSidebar: mockToggleShowSidebar,
    show: true
  });

  /**
   * Given we are using header component and we are showing sidebar
   */
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
   * Then sidebar should be toggled
   */
  expect(mockToggleShowSidebar).toHaveBeenCalledWith(false);
});

it("renders show sidebar icon but not close icon", () => {
  const mockToggleShowSidebar = jest.fn();
  const { ui } = setup({
    title,
    sidebar: true,
    toggleShowSidebar: mockToggleShowSidebar,
    show: false
  });

  /**
   * Given we are using header component and we are showing sidebar
   */
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
   * Then sidebar should be toggled
   */
  expect(mockToggleShowSidebar).toBeCalledWith(true);
});

function setup(props: Partial<Props>) {
  const { Ui, ...rest } = renderWithRouter(
    HeaderP,
    {},

    { logoAttrs: {} as any, ...props }
  );

  return {
    ui: <Ui />,
    ...rest
  };
}
