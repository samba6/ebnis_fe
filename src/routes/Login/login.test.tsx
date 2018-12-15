import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent } from "react-testing-library";

import { Login } from "./login-x";
import { makeClient, renderWithRouter } from "../../test_utils";

it("renders", () => {
  // tslint:disable-next-line:no-any
  const Login1 = Login as any;
  const client = makeClient();
  const mockGetConn = jest.fn(() => Promise.resolve(false));
  const { ui } = renderWithRouter(
    <Login1 client={client} getConnStatus={mockGetConn} />
  );

  const {
    debug,
    rerender,
    container,
    getByText,
    getByLabelText,
    queryByTestId,
    getByTestId
  } = render(ui);
  const $login = container.firstChild;
  expect($login).toContainElement(getByText(/Login to your account/));

  const $button = getByText(/Submit/);
  expect($button.getAttribute("name")).toBe("login-submit");
  expect($button).toHaveAttribute("disabled");

  const $email = getByLabelText("Email");
  fireEvent.change($email, {
    target: { value: "me@me.com" }
  });

  expect($login).not.toContainElement(queryByTestId("password-unmask"));
  expect($login).not.toContainElement(queryByTestId("password-mask"));

  const $pwd = getByLabelText("Password");
  const pwd = "awesome pass";

  fireEvent.change($pwd, {
    target: { value: pwd }
  });

  expect($login).toContainElement(getByTestId("password-unmask"));

  fireEvent.change($pwd, {
    target: { value: "" }
  });

  expect($login).not.toContainElement(queryByTestId("password-unmask"));

  fireEvent.change($pwd, {
    target: { value: pwd }
  });

  fireEvent.click(getByTestId("password-unmask"));
  expect($login).not.toContainElement(queryByTestId("password-unmask"));

  const $maskPwd = getByTestId("password-mask");
  expect($login).toContainElement($maskPwd);

  fireEvent.click($maskPwd);
  expect($login).not.toContainElement(queryByTestId("password-mask"));
  expect($login).toContainElement(getByTestId("password-unmask"));

  expect($button).not.toHaveAttribute("disabled");
  fireEvent.click($button);
  rerender(ui);
  // expect(mockGetConn.mock.calls.length).toBe(1);

  debug();
});
