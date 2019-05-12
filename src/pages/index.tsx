import React from "react";
import { RouteComponentProps } from "@reach/router";

import { Login } from "../components/Login";
import { SidebarHeader } from "../components/SidebarHeader";
import { ToOtherAuthLink } from "../components/ToOtherAuthLink";
import { Layout } from "../components/Layout";
import { useIsLoggedIn } from "../components/use-is-logged-in";

export default function LoginPage(props: RouteComponentProps) {
  const isLoggedIn = useIsLoggedIn();

  return (
    <Layout>
      {!isLoggedIn && (
        <div className="pages-signup">
          <SidebarHeader title="Sign up for Ebnis" wide={true} />

          <Login {...props} ToOtherAuthLink={ToOtherAuthLink} />
        </div>
      )}
    </Layout>
  );
}
