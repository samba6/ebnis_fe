/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";

import {
  ToOtherAuthLink,
  ToOtherAuthLinkProps,
} from "../components/ToOtherAuthLink";
import { LOGIN_URL, SIGN_UP_URL } from "../routes";

type P = ComponentType<Partial<ToOtherAuthLinkProps>>;
const ToOtherAuthLinkP = ToOtherAuthLink as P;

it("renders sign up link when in login route", () => {
  /**
   * Given we using the component while on login route
   */
  const { getByText, queryByText } = render(
    <ToOtherAuthLinkP pathname={LOGIN_URL} />,
  );

  /**
   * Then we should a link text telling us we can go to sign up route
   */
  expect(getByText(/ sign up/i)).toBeInTheDocument();

  /**
   * But the link should not tell us to go to login route
   */
  expect(queryByText(/ login/i)).not.toBeInTheDocument();
});

it("renders login link when in sign up route", () => {
  /**
   * Given we using the component while on sign up route
   */
  const { getByText, queryByText } = render(
    <ToOtherAuthLinkP pathname={SIGN_UP_URL} />,
  );

  /**
   * Then we should a link text telling us we can go to login in route
   */
  expect(getByText(/ login/i)).toBeInTheDocument();

  /**
   * But the link should not tell us to go to sign up route
   */
  expect(queryByText(/ sign up/i)).not.toBeInTheDocument();
});

it("disables the component", () => {
  /**
   * Given we are using the component and wish to disable the component
   */
  const { getByText } = render(
    <ToOtherAuthLinkP pathname={LOGIN_URL} isSubmitting={true} />,
  );

  /**
   * Then the component should be disabled
   */
  expect(getByText(/ sign up/i).classList).toContain("disabled");
});

it("does not disable the component", () => {
  /**
   * Given we are using the component and wish to not disable the component
   */
  const { getByText } = render(
    <ToOtherAuthLinkP pathname={LOGIN_URL} isSubmitting={false} />,
  );

  /**
   * Then the component should not be disabled
   */
  expect(getByText(/ sign up/i).classList).not.toContain("disabled");
});
