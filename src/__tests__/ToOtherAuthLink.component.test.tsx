/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { ComponentType } from "react";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import {
  ToOtherAuthLink,
  ToOtherAuthLinkProps,
} from "../components/ToOtherAuthLink";
import { LOGIN_URL, SIGN_UP_URL, ROOT_URL } from "../routes";

const ToOtherAuthLinkP = ToOtherAuthLink as ComponentType<
  Partial<ToOtherAuthLinkProps>
>;

it("renders sign up link when in login route", () => {
  /**
   * Given we using the component while on login route
   */
  render(<ToOtherAuthLinkP pathname={LOGIN_URL} />);

  /**
   * Then we should a link text telling us we can go to sign up route
   */
  expect(document.getElementById("to-other-auth-sign-up-link")).not.toBeNull();

  /**
   * But the link should not tell us to go to login route
   */
  expect(document.getElementById("to-other-auth-login-link")).toBeNull();
});

it("renders login link when in sign up route", () => {
  /**
   * Given we using the component while on sign up route
   */
  render(<ToOtherAuthLinkP pathname={SIGN_UP_URL} />);

  /**
   * Then we should a link text telling us we can go to login in route
   */
  expect(document.getElementById("to-other-auth-login-link")).not.toBeNull();

  /**
   * But the link should not tell us to go to sign up route
   */
  expect(document.getElementById("to-other-auth-sign-up-link")).toBeNull();
});

it("disables the component", () => {
  /**
   * Given we are using the component and wish to disable the component
   */
  render(<ToOtherAuthLinkP pathname={LOGIN_URL} isSubmitting={true} />);

  /**
   * Then the component should be disabled
   */
  expect(
    (document.getElementById("to-other-auth-sign-up-link") as HTMLButtonElement)
      .classList,
  ).toContain("disabled");
});

it("does not disable the component", () => {
  /**
   * Given we are using the component and wish to not disable the component
   */
  render(<ToOtherAuthLinkP pathname={LOGIN_URL} isSubmitting={false} />);

  /**
   * Then the component should not be disabled
   */
  expect(
    (document.getElementById("to-other-auth-sign-up-link") as HTMLButtonElement)
      .classList,
  ).not.toContain("disabled");
});



it("renders sign up link when in root route", () => {
  /**
   * Given we using the component while on login route
   */
  render(<ToOtherAuthLinkP pathname={ROOT_URL} />);

  /**
   * Then we should a link text telling us we can go to sign up route
   */
  expect(document.getElementById("to-other-auth-sign-up-link")).not.toBeNull();

  /**
   * But the link should not tell us to go to login route
   */
  expect(document.getElementById("to-other-auth-login-link")).toBeNull();
});
