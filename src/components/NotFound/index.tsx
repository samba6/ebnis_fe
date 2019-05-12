import React, { useEffect, useState, ReactNode } from "react";
import { RouteComponentProps } from "@reach/router";

import { Page404 } from "../Page404";

export function NotFound(props: RouteComponentProps & { default: boolean }) {
  const [child, setChild] = useState<ReactNode>(null);

  useEffect(() => {
    /**
     * The idea is that in production, if user visits a client only page
     * directly from browser address bar (not by clicking a link in the app),
     * this component will be showed briefly by gatsby before redirecting to
     * the visited url. If the url is found, Page404 will never be rendered.
     * But if after 500ms we have not been redirected by gatsby (because
     * url is unknown to this app), then we render Page404.
     */
    setTimeout(() => {
      setChild(<Page404 />);
    }, 500);
  }, []);

  return <>{child}</>;
}
