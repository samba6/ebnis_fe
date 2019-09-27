/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import {
  AuthRequired,
  Props,
} from "../components/AuthRequired/auth-required.componnet";
import { useUser } from "../components/use-user";
import { redirectToLogin } from "../components/AuthRequired/auth-required.injectables";

jest.mock("../components/use-user");
const mockUseUser = useUser as jest.Mock;

jest.mock("../components/AuthRequired/auth-required.injectables");
const mockRedirectToLogin = redirectToLogin as jest.Mock;

beforeEach(() => {
  mockUseUser.mockReset();
  mockRedirectToLogin.mockReset();
});

it("redirects to login if no authenticated user", () => {
  const { ui } = makeComp({
    props: {},
  });

  const {} = render(ui);
  expect(document.getElementById("00")).toBeNull();
  expect(mockRedirectToLogin).toHaveBeenCalled();
});

it("renders component if user is authenticated", () => {
  mockUseUser.mockReturnValue({});

  const { ui } = makeComp({
    props: {},
  });

  const {} = render(ui);

  expect(mockRedirectToLogin).not.toHaveBeenCalled();
  expect(document.getElementById("00")).not.toBeNull();
});

////////////////////////// HELPER FUNCTIONS ///////////////////////////

const AuthRequiredP = AuthRequired as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  return {
    ui: <AuthRequiredP {...props} component={RenderComponent} />,
  };
}

function RenderComponent() {
  return <div id="00" />;
}
