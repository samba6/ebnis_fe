import React from "react";
import { RouteProps, Route, Redirect } from "react-router-dom";

import { Props } from "./auth-required";
import { LOGIN_URL } from "../../Routing";

export function AuthRequired({ component: AuthComponent, ...rest }: Props) {
  function render(childProps: RouteProps) {
    if (rest.user) {
      return <AuthComponent {...rest} {...childProps} />;
    }

    return <Redirect to={LOGIN_URL} />;
  }

  return <Route {...rest} render={render} />;
}

export default AuthRequired;
