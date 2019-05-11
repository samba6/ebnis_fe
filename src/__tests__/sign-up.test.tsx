// tslint:disable:no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait, waitForElement } from "react-testing-library";

import { SignUp } from "../components/SignUp/sign-up-x";
import { Props } from "../components/SignUp/sign-up";
import { renderWithRouter, fillField } from "./test_utils";

jest.mock("../state/get-conn-status");
jest.mock("../refresh-to-app");
jest.mock("../components/SignUp/scrollToTop");

import { getConnStatus } from "../state/get-conn-status";
import { refreshToHome } from "../refresh-to-app";
import { scrollToTop } from "../components/SignUp/scrollToTop";

const mockGetConnStatus = getConnStatus as jest.Mock;
const mockRefreshToHome = refreshToHome as jest.Mock;
const mockScrollToTop = scrollToTop as jest.Mock;

const SignUpP = SignUp as ComponentType<Partial<Props>>;

it("renders correctly and submits", async () => {
  const user = {};

  const { ui, mockRegUser, mockUpdateLocalUser } = makeComp();

  mockRegUser.mockResolvedValue({
    data: {
      registration: user
    }
  });

  /**
   * Given we are using the signup component
   */
  const { getByText, getByLabelText } = render(ui);

  /**
   * Then the submit button should be disabled
   */
  const $button = getByText(/Submit/);
  expect($button).toBeDisabled();

  /**
   * And source field should be readonly
   */
  const $source = getByLabelText("Source");
  expect($source).toHaveAttribute("readonly");
  const $sourceParent = $source.closest(".form-field") as HTMLDivElement;
  expect($sourceParent.classList).toContain("disabled");

  /**
   * When we complete the form
   */
  fillField(getByLabelText("Name"), "Kanmii");
  fillField(getByLabelText("Email"), "me@me.com");
  fillField(getByLabelText("Password"), "awesome pass");
  fillField(getByLabelText("Password Confirm"), "awesome pass");

  /**
   * Then the submit button should be enabled
   */
  expect($button).not.toHaveAttribute("disabled");

  /**
   * When we submit the form
   */
  fireEvent.click($button);

  /**
   * Then correct data should be sent to the server
   */
  await wait(
    () =>
      expect(mockRegUser).toHaveBeenCalledWith({
        variables: {
          registration: {
            name: "Kanmii",
            email: "me@me.com",
            password: "awesome pass",
            passwordConfirmation: "awesome pass",
            source: "password"
          }
        }
      }),
    { interval: 1 }
  );

  /**
   * And data received from server should be saved locally on the client
   */
  expect(mockUpdateLocalUser).toHaveBeenCalledWith({ variables: { user } });

  /**
   * And we should be redirected
   */
  expect(mockRefreshToHome).toBeCalled();
});

it("renders error if socket not connected", async () => {
  /**
   * Given that we are not connected to the server
   */
  const { ui } = makeComp(false);

  /**
   * And we are using the signup component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(queryByTestId("sign-up-form-error")).not.toBeInTheDocument();

  /**
   * When we complete and submit the form
   */
  fillForm(getByLabelText, getByText);

  /**
   * Then we should see error UI
   */
  const $error = await waitForElement(() => getByTestId("sign-up-form-error"));
  expect($error).toBeInTheDocument();

  /**
   * And page should be automatically scrolled to the top of page
   */
  expect(mockScrollToTop).toBeCalled();
  mockScrollToTop.mockReset();
});

it("renders error if password and password confirm are not same", async () => {
  const { ui } = makeComp();

  /**
   * Given we are using signup component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(queryByTestId("sign-up-form-error")).not.toBeInTheDocument();

  /**
   * When complete the form, but the password and password confirm fields
   * do not match
   */
  fillField(getByLabelText("Name"), "Kanmii");
  fillField(getByLabelText("Email"), "me@me.com");
  fillField(getByLabelText("Password"), "awesome pass");
  fillField(getByLabelText("Password Confirm"), "awesome pass1");

  /**
   * And we submit the form
   */
  fireEvent.click(getByText(/Submit/));

  /**
   * Then we should see error UI
   */
  const $error = await waitForElement(() => getByTestId("sign-up-form-error"));
  expect($error).toBeInTheDocument();

  /**
   * And the page should be automatically scrolled up
   */
  expect(mockScrollToTop).toBeCalled();
  mockScrollToTop.mockReset();
});

it("renders error if server returns error", async () => {
  const { ui, mockRegUser } = makeComp();

  /**
   * Given that our server return error on form submission
   */
  mockRegUser.mockRejectedValue({
    message: "email"
  });

  /**
   * And that we are using the signup component
   */
  const { getByText, getByLabelText, getByTestId, queryByTestId } = render(ui);

  /**
   * Then we should not see any error UI
   */
  expect(queryByTestId("sign-up-form-error")).not.toBeInTheDocument();

  /**
   * When we complete and submit the form
   */
  fillForm(getByLabelText, getByText);

  /**
   * Then we should see error UI
   */
  const $error = await waitForElement(() => getByTestId("sign-up-form-error"));
  expect($error).toBeInTheDocument();

  /**
   * And we should be automatically scrolled to top
   */
  expect(mockScrollToTop).toBeCalled();

  /**
   * When we click on close button of error UI
   */
  fireEvent.click($error.querySelector(`[class="close icon"]`) as any);

  /**
   * Then the error UI should no longer ve visible
   */
  expect(queryByTestId("sign-up-form-error")).not.toBeInTheDocument();
});

function fillForm(getByLabelText: any, getByText: any) {
  fillField(getByLabelText("Name"), "Kanmii");
  fillField(getByLabelText("Email"), "me@me.com");
  fillField(getByLabelText("Password"), "awesome pass");
  fillField(getByLabelText("Password Confirm"), "awesome pass");
  fireEvent.click(getByText(/Submit/));
}

function makeComp(isServerConnected: boolean = true) {
  mockGetConnStatus.mockResolvedValue(isServerConnected);
  const { Ui, ...rest } = renderWithRouter(SignUpP);

  const mockRegUser = jest.fn();
  const mockUpdateLocalUser = jest.fn();

  return {
    ui: (
      <Ui
        regUser={mockRegUser}
        updateLocalUser={mockUpdateLocalUser}
        ToOtherAuthLink={jest.fn(() => (
          <div />
        ))}
      />
    ),
    mockRegUser,
    mockUpdateLocalUser,
    ...rest
  };
}
