/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import {
  SidebarSemantic,
  Props,
} from "../components/Sidebar/sidebar-semantic.component";
import { useUser } from "../components/use-user";
import { createLocation } from "./test_utils";
import { LocationProvider } from "../components/Layout/layout-providers";
import { onClickLogoutLinkCallback } from "../components/Sidebar/sidebar.injectables";

jest.mock("../components/use-user");
jest.mock("../components/Sidebar/sidebar.injectables");

const mockUseUser = useUser as jest.Mock;
const mockOnClickLogoutLinkCallback = onClickLogoutLinkCallback as jest.Mock;

beforeEach(() => {
  mockUseUser.mockReset();
  mockOnClickLogoutLinkCallback.mockReset();
});

test("links", () => {
  /**
   * Given user is logged in
   */

  mockUseUser.mockReturnValue({});

  const { ui, mockNavigate } = makeComp({
    props: {},
  });

  /**
   * When component is rendered
   */

  const {} = render(ui);

  /**
   * Then there should be no navigation
   */
  expect(mockNavigate).not.toHaveBeenCalled();

  /**
   * When we click on 'my experiences' link
   */
  (document.getElementById(
    "sidebar-my-experiences-link",
  ) as HTMLElement).click();

  /**
   * Then we should navigate to that page
   */
  expect(mockNavigate).toHaveBeenCalled();
  mockNavigate.mockClear();

  /**
   * When we click on 'experience definition' link
   */
  expect(mockNavigate).not.toHaveBeenCalled();
  (document.getElementById(
    "sidebar-new-experience-definition-link",
  ) as HTMLElement).click();

  /**
   * Then we should navigate to that page
   */
  expect(mockNavigate).toHaveBeenCalled();
  mockNavigate.mockClear();

  /**
   * When we click on refresh link
   */

  expect(mockOnClickLogoutLinkCallback).not.toHaveBeenCalled();
  (document.getElementById("sidebar-refresh-link") as HTMLElement).click();

  /**
   * Then page should be reloaded
   */

  expect(mockOnClickLogoutLinkCallback).toHaveBeenCalled();

  /**
   * When we click on logout link
   */

  expect(mockNavigate).not.toHaveBeenCalled();
  (document.getElementById("sidebar-logout-link") as HTMLElement).click();

  /**
   * Then we should navigate to logout route
   */

  expect(mockNavigate).toHaveBeenCalled();
});

it("does not render logout link if user is not logged in", () => {
  /**
   * Given user is not logged in
   */

  mockUseUser.mockReturnValue(null);

  const { ui } = makeComp();

  /**
   * When the component is rendered
   */
  render(ui);

  /**
   * Then 'my experiences' link should be visible
   */
  expect(document.getElementById("sidebar-my-experiences-link")).not.toBeNull();

  /**
   * But logout link should not be visible
   */

  expect(document.getElementById("sidebar-logout-link")).toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const SidebarSemanticP = SidebarSemantic as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const location = createLocation();

  return {
    ui: (
      <LocationProvider value={location as any}>
        <SidebarSemanticP {...props} />
      </LocationProvider>
    ),

    ...location,
  };
}
