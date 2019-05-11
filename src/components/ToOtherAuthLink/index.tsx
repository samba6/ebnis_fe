import React from "react";
import { Link } from "gatsby";
import { Button } from "semantic-ui-react";

import { SIGN_UP_URL, LOGIN_URL } from "../../routes";

export interface ToOtherAuthLinkProps {
  className?: string;
  name?: string;
  isSubmitting?: boolean;
  pathname: string;
}

const linkTexts = {
  [LOGIN_URL]: "Don't have an account? Sign Up",
  [SIGN_UP_URL]: " Already have an account? Login"
};

export function ToOtherAuthLink(props: ToOtherAuthLinkProps) {
  const { isSubmitting, pathname } = props;
  const to = pathname === LOGIN_URL ? SIGN_UP_URL : LOGIN_URL;

  return (
    <Button
      className="to-sign-up-button"
      type="button"
      fluid={true}
      to={to}
      disabled={isSubmitting}
      name="to-sign-up"
      as={Link}
      primary={true}
    >
      {linkTexts[to]}
    </Button>
  );
}
