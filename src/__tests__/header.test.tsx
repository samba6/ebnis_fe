import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import { render } from "react-testing-library";

import { Header } from "../components/Header/header-x";
import { Props } from "../components/Header/header";
import { LogoImageQuery_file_childImageSharp_fixed } from "../graphql/gatsby-types/LogoImageQuery";

type P = ComponentType<Partial<Props>>;
const HeaderP = Header as P;

const title = "My App title";

it("renders with sidebar, and no wide", () => {
  const { ui } = setup({ title, sidebar: true });

  /**
   * Given we are using header component
   */
  const { getByTestId, container, getByText } = render(ui);

  /**
   * Then header should not contain 'wide' class name
   */
  const header = container.firstChild as HTMLElement;
  expect(header.classList).not.toContain("wide");

  const sidebarTrigger = getByTestId("sidebar-trigger");
  expect(header).toContainElement(sidebarTrigger);

  const $titleContainer = getByTestId("app-header-title");
  expect($titleContainer.classList).not.toContain("no-sidebar");

  const $title = getByText(title);
  expect($title.classList).toContain("title_text");
});

it("if we have sidebar, then wide has no effect", () => {
  const { ui } = setup({ title, wide: true, sidebar: true });
  const { container } = render(ui);

  const header = container.firstChild as HTMLElement;
  expect(header.classList).not.toContain("wide");
});

it("if no sidebar, then wide has effect", () => {
  const { ui } = setup({ title, wide: true });
  const { container } = render(ui);

  const header = container.firstChild as HTMLElement;
  expect(header.classList).toContain("wide");
});

it("renders with logo, title, no sidebar, no wide", () => {
  const { ui } = setup({ title });

  const {
    queryByTestId,
    getByAltText,
    getByText,
    getByTestId,
    container
  } = render(ui);

  const header = container.firstChild as HTMLElement;
  expect(header.classList).not.toContain("wide");

  expect(getByAltText(/logo/i)).toBeInTheDocument();

  expect(queryByTestId("sidebar-trigger")).not.toBeInTheDocument();

  const $titleContainer = getByTestId("app-header-title");
  expect($titleContainer.classList).toContain("no-sidebar");

  const $title = getByText(title);
  expect($title.classList).not.toContain("title_text");
});

function setup(props: Partial<Props>) {
  return {
    ui: (
      <HeaderP
        logoAttrs={{} as LogoImageQuery_file_childImageSharp_fixed}
        {...props}
      />
    )
  };
}
