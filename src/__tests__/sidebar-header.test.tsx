// tslint:disable: no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import { render, fireEvent } from "react-testing-library";

import {
  SidebarHeader,
  Props
} from "../components/SidebarHeader/sidebar-header";
import { renderWithRouter } from "./test_utils";
import { Header } from "../components/Header/component";

const SidebarHeaderP = SidebarHeader as ComponentType<Partial<Props>>;
const title = "My shinning app";

it("renders with header no sidebar", () => {
  const { Ui } = makeComp();
  const { container, getByTestId, queryByTestId } = render(
    <Ui title={title} />
  );

  const sidebarHeader = container.firstChild;
  expect(sidebarHeader).toContainElement(getByTestId("app-header"));
  expect(sidebarHeader).not.toContainElement(queryByTestId("app-sidebar"));
});

it("renders with header and sidebar", () => {
  const { Ui } = makeComp();

  const { container: sidebarHeader, getByTestId, queryByTestId } = render(
    <Ui title={title} sidebar={true} />
  );
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

function makeComp() {
  return renderWithRouter(
    SidebarHeaderP,
    {},
    {
      Header: function HeaderComp(props: any) {
        const Ui = renderWithRouter(Header, {}, { logoAttrs: {}, ...props })
          .Ui as any;

        return <Ui />;
      }
    }
  );
}
