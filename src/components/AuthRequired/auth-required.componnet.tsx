import React, { ComponentType, useLayoutEffect } from "react";
import { useUser } from "../use-user";
import { RouteComponentProps, NavigateFn } from "@reach/router";
import { LOGIN_URL } from "../../routes";

export function AuthRequired(props: Props) {
  const { component: AuthComponent, ...rest } = props;
  const user = useUser();
  const navigate = rest.navigate as NavigateFn;

  useLayoutEffect(() => {
    if (!user) {
      navigate(LOGIN_URL);
      return;
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [user]);

  return user ? <AuthComponent {...rest} /> : null;
}

export type Props = RouteComponentProps & {
  component: ComponentType<RouteComponentProps>;
};
