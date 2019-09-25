/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "@marko/testing-library/cleanup-after-each";
import { render } from "@testing-library/react";
import { AuthRequired, Props } from "../components/AuthRequired";
import { useUser } from "../components/use-user";
import { LocationProvider } from "../components/Layout/layout-providers";
import { LOGIN_URL } from "../routes";

jest.mock("../components/use-user");
const mockUseUser = useUser as jest.Mock;

beforeEach(() => {
  mockUseUser.mockReset();
});

it("redirects to login if no authenticated user", () => {
  const { ui, mockNavigate } = makeComp({
    props: {},
  });

  const {} = render(ui);

  expect(mockNavigate).toHaveBeenCalledWith(LOGIN_URL);
  expect(document.getElementById("00")).toBeNull();
});

it("renders component if user is authenticated", () => {
  mockUseUser.mockReturnValue({});

  const { ui, mockNavigate } = makeComp({
    props: {},
  });

  const {} = render(ui);

  expect(mockNavigate).not.toHaveBeenCalled()
  expect(document.getElementById("00")).not.toBeNull();
});
////////////////////////// HELPER FUNCTIONS ///////////////////////////

const AuthRequiredP = AuthRequired as ComponentType<Partial<Props>>;

function makeComp({ props = {} }: { props?: Partial<Props> } = {}) {
  const mockNavigate = jest.fn();
  const context = { navigate: mockNavigate } as any;

  return {
    ui: (
      <LocationProvider value={context}>
        <AuthRequiredP {...props} component={RenderComponent} />
      </LocationProvider>
    ),

    mockNavigate,
  };
}

function RenderComponent() {
  return <div id="00" />;
}
