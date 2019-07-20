import React, { useEffect } from "react";
import { navigate } from "gatsby";

import { LOGIN_URL } from "../../routes";
import { useUser } from "../use-user";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AuthRequired(props: any) {
  const { component: AuthComponent, ...rest } = props;

  const user = useUser();

  useEffect(() => {
    if (!user) {
      navigate(LOGIN_URL);
    }
  }, [user]);

  return user ? <AuthComponent {...rest} /> : null;
}
