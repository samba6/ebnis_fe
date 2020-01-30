import React, { ComponentType, useLayoutEffect } from "react";
import { useUser } from "../use-user";
import { RouteComponentProps } from "@reach/router";
import { redirectToLogin } from "./auth-required.injectables";

export function AuthRequired(props: Props) {
  const { component: AuthComponent, ...rest } = props;
  const user = useUser();

  useLayoutEffect(() => {
    if (!user) {
      redirectToLogin();
      return;
    }
  }, [user]);

  return user ? <AuthComponent {...rest} /> : null;
}

export type Props = RouteComponentProps & {
  component: ComponentType<RouteComponentProps>;
};
