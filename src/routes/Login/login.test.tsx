import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait, waitForElement } from "react-testing-library";

import { Login } from "./login-x";
import { makeClient, renderWithRouter } from "../../test_utils";

it("renders correctly and submits", async () => {
  const user = {};
  const result = {
    data: {
      login: user
    }
  };

  const mockLogin = makeLoginFunc(result);
  const mockUpdateLocalUser = jest.fn();
  const mockRefreshToHome = jest.fn();

  const { ui } = makeComp({
    login: mockLogin,
    updateLocalUser: mockUpdateLocalUser,
    refreshToHome: mockRefreshToHome
  });

  const { container, getByText, getByLabelText } = render(ui);
  const $login = container.firstChild;
  expect($login).toContainElement(getByText(/Login to your account/));
  expect($login).toContainElement(getByText(/Don't have an account\? Sign Up/));

  const $button = getByText(/Submit/);
  expect($button.getAttribute("name")).toBe("login-submit");
  expect($button).toBeDisabled();

  const $email = getByLabelText("Email");
  expect($email.getAttribute("type")).toBe("email");

  const $pwd = getByLabelText("Password");
  expect($pwd.getAttribute("type")).toBe("password");

  fillField($email, "me@me.com");
  fillField($pwd, "awesome pass");
  expect($button).not.toHaveAttribute("disabled");
  fireEvent.click($button);

  await wait(() =>
    expect(mockUpdateLocalUser).toBeCalledWith({ variables: { user } })
  );

  expect(mockRefreshToHome).toBeCalled();
});

it("renders error if login function is null", async () => {
  const { ui } = makeComp({
    login: undefined
  });

  const { getByText, getByLabelText, getByTestId } = render(ui);

  fillForm(getByLabelText, getByText);
  const $error = await waitForElement(() => getByTestId("login-form-error"));
  expect($error).toContainElement(getByText(/Unknown error/));
});

it("renders error if socket not connected", async () => {
  const { ui } = makeComp({
    login: makeLoginFunc(),
    getConn: makeConn(false)
  });

  const { getByText, getByLabelText, getByTestId } = render(ui);
  fillForm(getByLabelText, getByText);

  const $error = await waitForElement(() => getByTestId("login-form-error"));
  expect($error).toContainElement(getByText(/You are not connected/));
});

it("renders error if email is invalid", async () => {
  const { ui } = makeComp({
    login: makeLoginFunc()
  });

  const { getByText, getByLabelText, getByTestId } = render(ui);

  fillField(getByLabelText("Email"), "invalid email");
  fillField(getByLabelText("Password"), "awesome pass");
  fireEvent.click(getByText(/Submit/));
  const $error = await waitForElement(() => getByTestId("login-form-error"));
  expect($error).toContainElement(getByText(/email/i));
});

it("renders error if password is invalid", async () => {
  const { ui } = makeComp({
    login: makeLoginFunc()
  });

  const { getByText, getByLabelText, getByTestId } = render(ui);

  fillField(getByLabelText("Email"), "awesome@email.com");
  fillField(getByLabelText("Password"), "12");
  fireEvent.click(getByText(/Submit/));
  const $error = await waitForElement(() => getByTestId("login-form-error"));
  expect($error).toContainElement(getByText(/too short/i));
});

it("renders error if server returns error", async () => {
  const mockLogin = jest.fn(() =>
    Promise.reject({
      message: "Invalid email/password"
    })
  );

  const { ui } = makeComp({
    login: mockLogin,
    updateLocalUser: jest.fn()
  });

  const { getByText, getByLabelText, getByTestId } = render(ui);
  fillForm(getByLabelText, getByText);

  const $error = await waitForElement(() => getByTestId("login-form-error"));
  expect($error).toContainElement(getByText(/Invalid email\/password/i));
});

// tslint:disable-next-line:no-any
function makeLoginFunc(data?: any) {
  if (data) {
    return jest.fn(() => Promise.resolve(data));
  }

  return jest.fn();
}

function fillField(element: Element, value: string) {
  fireEvent.change(element, {
    target: { value }
  });
}

// tslint:disable-next-line:no-any
function fillForm(getByLabelText: any, getByText: any) {
  fillField(getByLabelText("Email"), "me@me.com");
  fillField(getByLabelText("Password"), "awesome pass");
  fireEvent.click(getByText(/Submit/));
}

// tslint:disable-next-line:no-any
function makeComp(params: any = {}) {
  // tslint:disable-next-line:no-any
  const Login1 = Login as any;
  const client = makeClient();
  return renderWithRouter(
    <Login1 client={client} getConn={makeConn(true)} {...params} />
  );
}

function makeConn(conn?: boolean) {
  return jest.fn(() => Promise.resolve(conn));
}
