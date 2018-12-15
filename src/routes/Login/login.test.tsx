import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render, fireEvent, wait } from "react-testing-library";

import { Login } from "./login-x";
import { makeClient, renderWithRouter } from "../../test_utils";

it("renders correctly", async () => {
  // tslint:disable-next-line:no-any
  const Login1 = Login as any;
  const client = makeClient();

  const mockSubmit = jest.fn(() => Promise.resolve(false));

  const { ui } = renderWithRouter(
    <Login1 client={client} submit={mockSubmit} />
  );

  const { container, getByText, getByLabelText } = render(ui);
  const $login = container.firstChild;
  expect($login).toContainElement(getByText(/Login to your account/));

  const $button = getByText(/Submit/);
  expect($button.getAttribute("name")).toBe("login-submit");
  expect($button).toHaveAttribute("disabled");

  fireEvent.change(getByLabelText("Email"), {
    target: { value: "me@me.com" }
  });

  fireEvent.change(getByLabelText("Password"), {
    target: { value: "awesome pass" }
  });

  expect($button).not.toHaveAttribute("disabled");
  fireEvent.click($button);

  await wait(() => expect(mockSubmit.mock.calls.length).toBe(1));
});
