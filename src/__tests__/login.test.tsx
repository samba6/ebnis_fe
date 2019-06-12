// tslint:disable:no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait, waitForElement } from "react-testing-library";

import { Login } from "../components/Login/component";
import { Props } from "../components/Login/utils";
import { renderWithRouter, fillField } from "./test_utils";
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";

jest.mock("../state/get-conn-status");
jest.mock("../refresh-to-app");
jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null)
}));
jest.mock("../components/Login/scroll-to-top");

import { getConnStatus } from "../state/get-conn-status";
import { refreshToHome } from "../refresh-to-app";
import { scrollToTop } from "../components/Login/scroll-to-top";

const mockRefreshToHome = refreshToHome as jest.Mock;
const mockGetConnStatus = getConnStatus as jest.Mock;
const mockScrollToTop = scrollToTop as jest.Mock;

it("renders correctly and submits", async () => {
  /**
   * Given that server will return a valid user after form submission
   */
  const user = {};
  const { ui, mockLogin, mockUpdateLocalUser } = makeComp();

  mockLogin.mockResolvedValue({
    data: {
      login: user
    }
  });

  /**
   * When we start to use the login component
   */
  const { getByText, getByLabelText } = render(ui);

  /**
   * Then email field should be empty
   */
  const $email = getByLabelText("Email") as any;
  expect($email.value).toBe("");

  /**
   * Then the submit button should be disabled
   */
  const $button = getByText(/Submit/);
  expect($button).toBeDisabled();

  /**
   * When the form is correctly completed
   */
  fillField($email, "me@me.com");
  fillField(getByLabelText("Password"), "awesome pass");

  /**
   * Then the submit button should be enabled
   */
  expect($button).not.toHaveAttribute("disabled");

  /**
   * When we submit the form
   */
  fireEvent.click($button);

  /**
   * Then the correct data should be uploaded to the server
   */
  await wait(
    () =>
      expect(mockLogin).toBeCalledWith({
        variables: {
          login: {
            email: "me@me.com",
            password: "awesome pass"
          }
        }
      }),
    { interval: 1 }
  );

  /**
   * And user should be saved on the client
   */
  expect(mockUpdateLocalUser).toBeCalledWith({ variables: { user } });

  /**
   * And we should be redirected
   */
  expect(mockRefreshToHome).toBeCalled();

  /**
   * And page should not be scrolled to top
   */
  expect(mockScrollToTop).not.toBeCalled();
});

it("renders error if socket not connected", async () => {
  /**
   * Given that server is not connected
   */
  const { ui } = makeComp({ isConnected: false });

  /**
   * When we start using the login component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(queryByTestId("other-errors")).not.toBeInTheDocument();

  /**
   * When we complete and submit the form
   */
  fillForm(getByLabelText, getByText);

  /**
   * Then we should see an error about not being connected
   */
  const $error = await waitForElement(() => getByTestId("other-errors"));
  expect($error).toBeInTheDocument();

  /**
   * And page should be scrolled to top
   */
  expect(
    (mockScrollToTop.mock.calls[0][0] as HTMLElement).dataset.testid
  ).toEqual("components-login-main");
});

it("renders error if email is invalid", async () => {
  const { ui } = makeComp();

  /**
   * Given that we are using the login component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(queryByTestId("form-errors")).not.toBeInTheDocument();

  /**
   * When we complete the form with invalid email and submit
   */
  fillField(getByLabelText("Email"), "invalid email");
  fillField(getByLabelText("Password"), "awesome pass");
  fireEvent.click(getByText(/Submit/));

  /**
   * Then we should see an error UI
   */
  const $error = await waitForElement(() => getByTestId("form-errors"));
  expect($error).toBeInTheDocument();
});

it("renders error if password is invalid", async () => {
  const { ui } = makeComp();

  /**
   * Given that we are using the login component
   */
  const { getByText, getByLabelText, getByTestId } = render(ui);

  /**
   * When we complete the form with wrong password and submit
   */
  fillField(getByLabelText("Email"), "awesome@email.com");
  fillField(getByLabelText("Password"), "12");
  fireEvent.click(getByText(/Submit/));

  /**
   * Then we should see an error about the wrong password
   */
  const $error = await waitForElement(() => getByTestId("form-errors"));
  expect($error).toBeInTheDocument();

  /**
   * And page should be scrolled to top
   */
  expect(mockScrollToTop).toBeCalled();
});

it("renders error if server returns field errors", async () => {
  /**
   * Given that server will return field errors
   */
  const { ui, mockLogin } = makeComp();

  mockLogin.mockRejectedValue(
    new ApolloError({
      graphQLErrors: [new GraphQLError(`{"error":"Invalid email/password"}`)]
    })
  );

  /**
   * Given that we are using the login component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(queryByTestId("server-field-errors")).not.toBeInTheDocument();

  /**
   * When we complete and submit the form, but server returns an error
   */
  fillForm(getByLabelText, getByText);

  /**
   * Then we should see an error message
   */
  const $error = await waitForElement(() => getByTestId("server-field-errors"));
  expect($error).toBeInTheDocument();

  /**
   * When we click on close button of error UI
   */
  fireEvent.click($error.querySelector(`.close.icon`) as any);

  /**
   * Then the error UI should no longer be visible
   */
  expect(queryByTestId("server-field-errors")).not.toBeInTheDocument();

  /**
   * And page should be scrolled to top
   */
  expect(mockScrollToTop).toBeCalled();
});

it("renders error if server returns network errors", async () => {
  const { ui, mockLogin } = makeComp();

  /**
   * Given that server will return network error
   */
  mockLogin.mockRejectedValue(
    new ApolloError({
      networkError: new Error("network error")
    })
  );

  /**
   * When we start to use the login component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(queryByTestId("network-error")).not.toBeInTheDocument();

  /**
   * When we complete and submit the form
   */
  fillForm(getByLabelText, getByText);

  /**
   * Then we should see an error message
   */
  const $error = await waitForElement(() => getByTestId("network-error"));
  expect($error).toBeInTheDocument();

  /**
   * And page should be scrolled to top
   */
  expect(mockScrollToTop).toBeCalled();
});

it("pre-fills form with user data", async () => {
  /**
   * Given user has logged out
   */

  const { ui } = makeComp({
    props: {
      localUser: {
        loggedOutUser: {
          email: "me@me.com"
        }
      } as any
    }
  });

  /**
   * When we start to use the login component
   */
  const { getByLabelText } = render(ui);

  /**
   * Then email input should be pre-filled with user email
   */
  expect((getByLabelText("Email") as any).value).toBe("me@me.com");
});

function fillForm(getByLabelText: any, getByText: any) {
  fillField(getByLabelText("Email"), "me@me.com");
  fillField(getByLabelText("Password"), "awesome pass");
  fireEvent.click(getByText(/Submit/));
}

function makeComp({
  isConnected = true,
  props = {}
}: { isConnected?: boolean; props?: Partial<Props> } = {}) {
  mockScrollToTop.mockReset();

  mockGetConnStatus.mockReset();
  mockGetConnStatus.mockResolvedValue(isConnected);

  const LoginP = Login as ComponentType<Partial<Props>>;
  const mockLogin = jest.fn();
  const mockUpdateLocalUser = jest.fn();
  const { Ui, ...rest } = renderWithRouter(LoginP);

  return {
    ui: (
      <Ui login={mockLogin} updateLocalUser={mockUpdateLocalUser} {...props} />
    ),
    ...rest,
    mockLogin,
    mockUpdateLocalUser
  };
}
