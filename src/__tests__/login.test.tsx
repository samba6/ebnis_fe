// tslint:disable:no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait, waitForElement } from "react-testing-library";

import { Login } from "../components/Login/login-x";
import { Props } from "../components/Login/login";
import { renderWithRouter, fillField } from "./test_utils";

jest.mock("../state/get-conn-status");
jest.mock("../refresh-to-app");

import { getConnStatus } from "../state/get-conn-status";
import { refreshToHome } from "../refresh-to-app";

const mockRefreshToHome = refreshToHome as jest.Mock;
const mockGetConnStatus = getConnStatus as jest.Mock;

it("renders correctly and submits", async () => {
  const user = {};
  const result = {
    data: {
      login: user
    }
  };

  const { ui, mockLogin, mockUpdateLocalUser } = makeComp();

  mockLogin.mockResolvedValue(result);

  /**
   * Given that we are using the login component
   */
  const { getByText, getByLabelText } = render(ui);

  /**
   * Then the submit button should be disabled
   */
  const $button = getByText(/Submit/);
  expect($button).toBeDisabled();

  /**
   * When the form is correctly completed
   */
  fillField(getByLabelText("Email"), "me@me.com");
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
});

it("renders error if socket not connected", async () => {
  const { ui } = makeComp(false);

  /**
   * Given that we using the login component
   */
  const { getByText, getByLabelText, getByTestId } = render(ui);

  /**
   * But we are not connected to the server
   */

  /**
   * When we complete and submit the form
   */
  fillForm(getByLabelText, getByText);

  /**
   * Then we should see an error about not being connected
   */
  const $error = await waitForElement(() => getByTestId("login-form-error"));
  expect($error).toContainElement(getByText(/You are not connected/));
});

it("renders error if email is invalid", async () => {
  const { ui } = makeComp();

  /**
   * Given that we are using the login component
   */
  const { getByText, getByLabelText, getByTestId } = render(ui);

  /**
   * When we complete the form with invalid email and submit
   */
  fillField(getByLabelText("Email"), "invalid email");
  fillField(getByLabelText("Password"), "awesome pass");
  fireEvent.click(getByText(/Submit/));

  /**
   * Then we should see an error UI
   */
  const $error = await waitForElement(() => getByTestId("login-form-error"));
  expect($error).toContainElement(getByText(/email/i));
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
  const $error = await waitForElement(() => getByTestId("login-form-error"));
  expect($error).toContainElement(getByText(/too short/i));
});

it("renders error if server returns error", async () => {
  const { ui, mockLogin } = makeComp();

  mockLogin.mockRejectedValue({
    message: "Invalid email/password"
  });

  /**
   * Given that we are using the login component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(queryByTestId("login-form-error")).not.toBeInTheDocument();

  /**
   * When we complete and submit the form, but server returns an error
   */
  fillForm(getByLabelText, getByText);

  /**
   * Then we should see an error message
   */
  const $error = await waitForElement(() => getByTestId("login-form-error"));
  expect($error).toBeInTheDocument();

  /**
   * When we click on close button of error UI
   */
  fireEvent.click($error.querySelector(`[class="close icon"]`) as any);

  /**
   * Then the error UI should no longer ve visible
   */
  expect(queryByTestId("login-form-error")).not.toBeInTheDocument();
});

function fillForm(getByLabelText: any, getByText: any) {
  fillField(getByLabelText("Email"), "me@me.com");
  fillField(getByLabelText("Password"), "awesome pass");
  fireEvent.click(getByText(/Submit/));
}

function makeComp(isServerConnected: boolean = true) {
  mockGetConnStatus.mockResolvedValue(isServerConnected);
  const LoginP = Login as ComponentType<Partial<Props>>;
  const mockLogin = jest.fn();
  const mockUpdateLocalUser = jest.fn();
  const { Ui, ...rest } = renderWithRouter(LoginP);

  return {
    ui: (
      <Ui
        login={mockLogin}
        updateLocalUser={mockUpdateLocalUser}
        ToOtherAuthLink={jest.fn(() => (
          <div />
        ))}
      />
    ),
    ...rest,
    mockLogin,
    mockUpdateLocalUser
  };
}
