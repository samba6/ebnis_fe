import React from "react";

import "./styles.scss";
import { Login } from "../../components/Login";
import { SidebarHeader } from "../../components/SidebarHeader";
import { RouteComponentProps } from "@reach/router";
import { ToOtherAuthLink } from "../../components/ToOtherAuthLink";

export default function LoginPage(props: RouteComponentProps) {
  return (
    <div className="pages-login">
      <SidebarHeader title="Login to your account" wide={true} />

      <Login {...props} ToOtherAuthLink={ToOtherAuthLink} />
    </div>
  );
}
