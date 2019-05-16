// tslint:disable:no-any
import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait, waitForElement } from "react-testing-library";

import { SignUp } from "../components/SignUp/component";
import { Props } from "../components/SignUp/utils";
import { renderWithRouter, fillField } from "./test_utils";

jest.mock("../state/get-conn-status");
jest.mock("../refresh-to-app");
jest.mock("../components/SignUp/scrollToTop");
jest.mock("../components/SidebarHeader", () => ({
  SidebarHeader: jest.fn(() => null)
}));

import { getConnStatus } from "../state/get-conn-status";
import { refreshToHome } from "../refresh-to-app";
import { scrollToTop } from "../components/SignUp/scrollToTop";
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";

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
  expect(queryByTestId("other-errors")).not.toBeInTheDocument();

  /**
   * When we complete and submit the form
   */
  fillForm(getByLabelText, getByText);

  /**
   * Then we should see error UI
   */
  const $error = await waitForElement(() => getByTestId("other-errors"));
  expect($error).toBeInTheDocument();

  /**
   * And page should be automatically scrolled to the top of page
   */
  expect((mockScrollToTop.mock.calls[0][0] as any).current.dataset.testid).toBe(
    "components-signup-main"
  );
});

it("renders error if password and password confirm are not same", async () => {
  const { ui } = makeComp();

  /**
   * Given we are using signup component
   */
  const { getByText, getByLabelText, queryByText } = render(ui);

  /**
   * Then we should not see any error UI
   */
  const passwordConfirmErrorRegexp = /Passwords do not match/i;
  expect(queryByText(passwordConfirmErrorRegexp)).not.toBeInTheDocument();
  const $passwordConfirmParent = getByLabelText("Password Confirm").closest(
    ".form-field"
  ) as HTMLElement;
  expect($passwordConfirmParent.classList).not.toContain("error");

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
  const $error = await waitForElement(() =>
    getByText(passwordConfirmErrorRegexp)
  );
  expect($error).toBeInTheDocument();
  expect($passwordConfirmParent.classList).toContain("error");

  /**
   * And the page should be automatically scrolled up
   */
  expect(mockScrollToTop).toBeCalled();
});

it("renders errors if server returns network errors", async () => {
  const { ui, mockRegUser } = makeComp();

  /**
   * Given that our server will return network error on form submission
   */
  mockRegUser.mockRejectedValue(
    new ApolloError({
      networkError: new Error("network error")
    })
  );

  /**
   * When we start using the component
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
   * Then we should see error UI
   */
  const $error = await waitForElement(() => getByTestId("network-error"));
  expect($error).toBeInTheDocument();

  /**
   * And we should be automatically scrolled to top
   */
  expect(mockScrollToTop).toBeCalled();
});

it("renders errors if server returns field errors", async () => {
  const { ui, mockRegUser } = makeComp();

  /**
   * Given that our server will return field errors on form submission
   */
  mockRegUser.mockRejectedValue(
    new ApolloError({
      graphQLErrors: [
        new GraphQLError(`{"errors":{"email":"has already been taken"}}`)
      ]
    })
  );

  /**
   * When we start using the component
   */
  const {
    getByText,
    getByLabelText,
    getByTestId,
    queryByTestId,
    queryByText
  } = render(ui);

  /**
   * Then we should not see error summary UI
   */
  expect(queryByTestId("server-field-error")).not.toBeInTheDocument();

  /**
   * And we should not see field error
   */
  expect(queryByText("has already been taken")).not.toBeInTheDocument();
  const $emailParent = getByLabelText(/email/i).closest(
    ".form-field"
  ) as HTMLElement;
  expect($emailParent.classList).not.toContain("error");

  /**
   * When we complete and submit the form
   */
  fillForm(getByLabelText, getByText);

  /**
   * Then we should see error summary
   */
  const $error = await waitForElement(() => getByTestId("server-field-error"));
  expect($error).toBeInTheDocument();

  /**
   * And we should see field error
   */
  expect(getByText("has already been taken")).toBeInTheDocument();

  /**
   * And field error should visually indicate so
   */
  expect($emailParent.classList).toContain("error");

  /**
   * And we should be automatically scrolled to top
   */
  expect(mockScrollToTop).toBeCalled();

  /**
   * When we click on close button of error UI
   */
  fireEvent.click($error.querySelector(`[class="close icon"]`) as any);

  /**
   * Then error summary should no longer ve visible
   */
  expect(queryByTestId("server-field-error")).not.toBeInTheDocument();

  /**
   * But field error should still be visible
   */
  expect(getByText("has already been taken")).toBeInTheDocument();
});

function fillForm(getByLabelText: any, getByText: any) {
  fillField(getByLabelText("Name"), "Kanmii");
  fillField(getByLabelText("Email"), "me@me.com");
  fillField(getByLabelText("Password"), "awesome pass");
  fillField(getByLabelText("Password Confirm"), "awesome pass");
  fireEvent.click(getByText(/Submit/));
}

function makeComp(isServerConnected: boolean = true) {
  mockScrollToTop.mockReset();
  mockGetConnStatus.mockResolvedValue(isServerConnected);
  const { Ui, ...rest } = renderWithRouter(SignUpP);

  const mockRegUser = jest.fn();
  const mockUpdateLocalUser = jest.fn();

  return {
    ui: <Ui regUser={mockRegUser} updateLocalUser={mockUpdateLocalUser} />,
    mockRegUser,
    mockUpdateLocalUser,
    ...rest
  };
}
