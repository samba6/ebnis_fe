import React from "react";
import { Link } from "gatsby";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import makeClassNames from "classnames";
import { SIGN_UP_URL, LOGIN_URL } from "../../routes";

export interface ToOtherAuthLinkProps {
  className?: string;
  name?: string;
  isSubmitting?: boolean;
  pathname: string;
}

const linkTexts = {
  [SIGN_UP_URL]: "Don't have an account? Sign Up",
  [LOGIN_URL]: " Already have an account? Login"
};

export function ToOtherAuthLink(props: ToOtherAuthLinkProps) {
  const { isSubmitting, pathname, className = "" } = props;
  const to = pathname === LOGIN_URL ? SIGN_UP_URL : LOGIN_URL;

  return (
    <Button
      className={makeClassNames({
        "to-other-auth-button": true,
        [className]: className
      })}
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
