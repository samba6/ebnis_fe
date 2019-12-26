import React from "react";
import { Helmet } from "react-helmet-async";
import { Login } from "../../components/Login/login.component";
import { RouteComponentProps } from "@reach/router";
import { Layout } from "../../components/Layout/layout.component";
import { makeSiteTitle } from "../../constants";

export default function LoginPage(props: RouteComponentProps) {
  return (
    <Layout {...props}>
      <Helmet>
        <title>{makeSiteTitle("Log in")}</title>
      </Helmet>

      <Login />
    </Layout>
  );
}
