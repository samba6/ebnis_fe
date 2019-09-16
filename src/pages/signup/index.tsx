import React from "react";
import { RouteComponentProps } from "@reach/router";
import { Helmet } from "react-helmet-async";

import { SignUp } from "../../components/Signup/signup.component";
import { Layout } from "../../components/Layout/layout.component";
import { useIsLoggedIn } from "../../components/use-is-logged-in";
import { makeSiteTitle } from "../../constants";

export default function SignUpPage(props: RouteComponentProps) {
  const isLoggedIn = useIsLoggedIn();

  return (
    <Layout {...props}>
      <Helmet>
        <title>{makeSiteTitle("Sign up")}</title>
      </Helmet>

      {!isLoggedIn && <SignUp {...props} />}
    </Layout>
  );
}
