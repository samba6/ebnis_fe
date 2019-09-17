import React, { useEffect, ComponentType } from "react";
import { navigate } from "gatsby";

import { LOGIN_URL } from "../routes";
import { useUser } from "./use-user";
import { RouteComponentProps } from "@reach/router";

export function AuthRequired(
  props: RouteComponentProps & {
    component: ComponentType<RouteComponentProps>;
  },
) {
  const { component: AuthComponent, ...rest } = props;

  const user = useUser();

  useEffect(() => {
    if (!user) {
      navigate(LOGIN_URL);
    }
  }, [user]);

  return user ? <AuthComponent {...rest} /> : null;
}
