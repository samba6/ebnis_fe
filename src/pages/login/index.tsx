import React from "react";
import { Helmet } from "react-helmet-async";

import { Login } from "../../components/Login";
import { RouteComponentProps } from "@reach/router";
import { Layout } from "../../components/Layout";
import { useIsLoggedIn } from "../../components/use-is-logged-in";
import { makeSiteTitle } from "../../constants";

export default function LoginPage(props: RouteComponentProps) {
  const isLoggedIn = useIsLoggedIn();

  return (
    <Layout>
      <Helmet>
        <title>{makeSiteTitle("Log in")}</title>
      </Helmet>

      {!isLoggedIn && <Login {...props} />}
    </Layout>
  );
}
