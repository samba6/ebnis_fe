import React, { ComponentType, useContext, useLayoutEffect } from "react";
import { LOGIN_URL } from "../routes";
import { useUser } from "./use-user";
import { RouteComponentProps } from "@reach/router";
import { LocationContext } from "./Layout/layout.utils";

export function AuthRequired(props: Props) {
  const { component: AuthComponent, ...rest } = props;
  const { navigate } = useContext(LocationContext);
  const user = useUser();

  useLayoutEffect(() => {
    if (!user) {
      navigate(LOGIN_URL);
    }
  }, [user, navigate]);

  return user ? <AuthComponent {...rest} /> : null;
}

export type Props = RouteComponentProps & {
  component: ComponentType<RouteComponentProps>;
};
