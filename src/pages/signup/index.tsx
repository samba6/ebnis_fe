import React from "react";
import { RouteComponentProps } from "@reach/router";

import "./styles.scss";
import { SignUp } from "../../components/SignUp";
import { SidebarHeader } from "../../components/SidebarHeader";
import { ToOtherAuthLink } from "../../components/ToOtherAuthLink";

export default function SignUpPage(props: RouteComponentProps) {
  return (
    <div className="pages-signup">
      <SidebarHeader title="Sign up for Ebnis" wide={true} />

      <SignUp {...props} ToOtherAuthLink={ToOtherAuthLink} />
    </div>
  );
}
