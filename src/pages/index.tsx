import React from "react";
import { RouteComponentProps } from "@reach/router";
import { Helmet } from "react-helmet-async";

import { Login } from "../components/Login";

import { Layout } from "../components/Layout";
import { useIsLoggedIn } from "../components/use-is-logged-in";
import { SITE_TITLE } from "../constants";

export default function LoginPage(props: RouteComponentProps) {
  const isLoggedIn = useIsLoggedIn();

  return (
    <Layout>
      <Helmet>
        <title>{SITE_TITLE}</title>
      </Helmet>

      {!isLoggedIn && <Login {...props} />}
    </Layout>
  );
}
