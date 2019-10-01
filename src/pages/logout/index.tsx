import React from "react";
import {Login} from "../../components/Login/login.component";
import {RouteComponentProps} from "@reach/router";
import {Layout} from "../../components/Layout/layout.component";

export default function LogoutPage(props: RouteComponentProps) {
  return (
    <Layout {...props}>

      <Login />
    </Layout>
  );
}
