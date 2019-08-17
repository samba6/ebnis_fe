import React from "react";
import { Link } from "gatsby";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import makeClassNames from "classnames";
import { SIGN_UP_URL, LOGIN_URL } from "../routes";

export interface ToOtherAuthLinkProps {
  className?: string;
  name?: string;
  isSubmitting?: boolean;
  pathname: string;
}

const linkTexts = {
  [SIGN_UP_URL]: [
    "Don't have an account? Sign Up",
    "to-other-auth-sign-up-link",
  ],
  [LOGIN_URL]: ["Already have an account? Login", "to-other-auth-login-link"],
};

export function ToOtherAuthLink(props: ToOtherAuthLinkProps) {
  const { isSubmitting, pathname, className = "" } = props;

  const path = pathname === LOGIN_URL ? SIGN_UP_URL : LOGIN_URL;

  const [text, id] = linkTexts[path];

  return (
    <Button
      className={makeClassNames({
        "to-other-auth-button": true,
        [className]: className,
      })}
      type="button"
      fluid={true}
      to={path}
      disabled={isSubmitting}
      name="to-sign-up"
      as={Link}
      primary={true}
      id={id}
    >
      {text}
    </Button>
  );
}
