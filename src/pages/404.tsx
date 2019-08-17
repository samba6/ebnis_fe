import React from "react";
import { Helmet } from "react-helmet-async";

import { Page404 } from "../components/Page404";
import { Layout } from "../components/Layout/layout";
import { RouteComponentProps } from "@reach/router";
import { makeSiteTitle, PAGE_NOT_FOUND_TITLE } from "../constants";

export default function(props: RouteComponentProps) {
  return (
    <Layout {...props}>
      <Helmet>
        <title>{makeSiteTitle(PAGE_NOT_FOUND_TITLE)}</title>
      </Helmet>

      <Page404 {...props} />
    </Layout>
  );
}
