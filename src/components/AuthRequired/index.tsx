import React, { useEffect } from "react";
import { navigate } from "gatsby";

import { LOGIN_URL } from "../../routes";
import { withUserHOC } from "../with-user";

// tslint:disable-next-line: no-any
function AuthRequiredComp(props: any) {
  const { component, user, ...rest } = props;

  useEffect(() => {
    if (!user) {
      navigate(LOGIN_URL);
    }
  }, [user]);

  const AuthComponent = component;

  return <AuthComponent {...rest} />;
}

export const AuthRequired = withUserHOC(AuthRequiredComp);
