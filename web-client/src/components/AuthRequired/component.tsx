import React from "react";
import { RouteProps, Route } from "react-router-dom";

import { Props } from "./auth-required";

export const AuthRequired = ({
  component: AuthComponent,
  redirectTo: RedirectTo,
  ...rest
}: Props) => {
  const render = (childProps: RouteProps) => {
    if (rest.user) {
      return <AuthComponent {...childProps} {...rest} />;
    }

    return <RedirectTo {...childProps} {...rest} />;
  };

  return <Route render={render} />;
};

export default AuthRequired;
