/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import { render, fireEvent } from "@testing-library/react";
import { Header, Props } from "../components/Header/header.component";
import { ILayoutContextHeaderValue } from "../components/Layout/layout.utils";
import { UPLOAD_UNSAVED_PREVIEW_URL } from "../constants/upload-unsaved-routes";
import {
  LayoutProvider,
  LocationProvider,
} from "../components/Layout/layout-providers";
import { WindowLocation } from "@reach/router";

const title = "My App title";

it("renders sidebar", () => {
  const { ui } = setup({ props: { title, sidebar: true } });

  /**
   * Given we are using header component
   */
  render(ui);

  /**
   * Then header should contain the sidebar trigger UI
   */
  expect(document.getElementById("header-sidebar-trigger")).not.toBeNull();

  /**
   * And app title should reflect that we are showing sidebar
   */
});

it("does not render sidebar", () => {
  const { ui } = setup({ props: { title } });

  /**
   * Given we are using header component
   */
  render(ui);

  /**
   * Then header should not render sidebar trigger UI
   */
  expect(document.getElementById("header-sidebar-trigger")).toBeNull();
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

  render(ui);

  /**
   * Then show sidebar icon should not be visible
   */

  expect(document.getElementById("header-show-sidebar-icon")).toBeNull();

  /**
   * And close sidebar icon should be visible
   */
  const $close = document.getElementById("header-close-sidebar-icon") as any;

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

  render(ui);

  /**
   * Then show sidebar icon should be visible
   */

  const $show = document.getElementById("header-show-sidebar-icon") as any;

  /**
   * And close sidebar icon should not be visible
   */
  expect(document.getElementById("header-close-sidebar-icon")).toBeNull();

  /**
   * When we click on the show icon
   */
  fireEvent.click($show);

  /**
   * Then sidebar should be toggled open
   */
  expect(mockToggleShowSidebar).toBeCalledWith(true);

  expect(document.getElementById("header-unsaved-count-label")).toBeNull();
});

it("renders unsaved count when not in 'upload unsaved' route", () => {
  const { ui } = setup({
    context: {
      unsavedCount: 1,
    },
  });

  render(ui);

  expect(document.getElementById("header-unsaved-count-label")).not.toBeNull();

  expect(document.getElementsByClassName(
    "header--disconnected",
  )[0] as HTMLElement).toBeDefined();

  expect(
    document.getElementsByClassName("header--connected")[0],
  ).toBeUndefined();
});

it("does not render unsaved count in 'upload unsaved' route", () => {
  const { ui } = setup({
    context: {
      unsavedCount: 1,
      hasConnection: true,
    },

    location: { pathname: UPLOAD_UNSAVED_PREVIEW_URL } as any,
  });

  render(ui);

  expect(document.getElementById("header-unsaved-count-label")).toBeNull();

  expect(document.getElementsByClassName(
    "header--disconnected",
  )[0] as HTMLElement).toBeUndefined();

  expect(document.getElementsByClassName("header--connected")[0]).toBeDefined();
});

it("does not render title when there is none to render", () => {
  const { ui } = setup({
    props: {
      title: "",
    },
  });

  render(ui);

  expect(document.getElementById("header-app-header-title")).toBeNull();
});

it("renders children", () => {
  const { ui } = setup({
    props: {
      title: "",
      children: <div id="c" />,
    },
  });

  render(ui);

  expect(document.getElementById("header-app-header-title")).toBeNull();

  expect(document.getElementById("c")).not.toBeNull();
});

it("renders only title if there are title and children", () => {
  const { ui } = setup({
    props: {
      title: "tt",
      children: <div id="c" />,
    },
  });

  render(ui);

  expect(document.getElementById("header-app-header-title")).not.toBeNull();

  expect(document.getElementById("c")).toBeNull();
});

it("sets class name", () => {
  const { ui } = setup({
    props: {
      className: "a",
    },
  });

  render(ui);

  expect(document.getElementsByClassName("a")[0]).toBeDefined();
});

it("does not render show sidebar icon if has unsaved", () => {
  /**
   * Given we have unsaved items and we would like to show sidebar, but have
   * not sent command to show sidebar
   */
  const { ui } = setup({
    props: {
      title,
      sidebar: true,
      show: false,
    },

    context: {
      unsavedCount: 1,
    },
  });

  /**
   * When component is rendered
   */

  render(ui);

  /**
   * Then unsaved count show be be shown
   */

  expect(document.getElementById("header-unsaved-count-label")).not.toBeNull();

  /**
   * And show sidebar icon should not be visible
   */

  expect(document.getElementById("header-show-sidebar-icon")).toBeNull();
});

it("does not render hide sidebar icon if has unsaved", () => {
  /**
   * Given we have unsaved items and we would like to show sidebar and have
   * sent command to show sidebar
   */
  const { ui } = setup({
    props: {
      title,
      sidebar: true,
      show: true,
    },

    context: {
      unsavedCount: 1,
    },
  });

  /**
   * When component is rendered
   */

  render(ui);

  /**
   * Then unsaved count show be be shown
   */

  expect(document.getElementById("header-unsaved-count-label")).not.toBeNull();

  /**
   * And close sidebar icon should not be visible
   */

  expect(document.getElementById("header-close-sidebar-icon")).toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const HeaderP = Header as ComponentType<Partial<Props>>;

function setup(args: Args = {}) {
  const props = args.props || {};
  const locationContextValue = {
    pathname: "",
    ...(args.location || {}),
  };

  const context = args.context || {};

  return {
    ui: (
      <LocationProvider value={locationContextValue as any}>
        <LayoutProvider value={context as any}>
          <HeaderP {...props} />
        </LayoutProvider>
      </LocationProvider>
    ),
  };
}

interface Args {
  props?: Partial<Props>;
  context?: Partial<ILayoutContextHeaderValue>;
  location?: Partial<WindowLocation>;
}
