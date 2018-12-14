import React from "react";
import { RouteProps, Route, Redirect } from "react-router-dom";

import { LOGIN_URL } from "../../Routing";
import { UserLocalGqlData } from "../../state/auth.local.query";

interface Props extends RouteProps, UserLocalGqlData {
  component: React.ComponentClass<{}> | React.StatelessComponent<{}>;
}

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
