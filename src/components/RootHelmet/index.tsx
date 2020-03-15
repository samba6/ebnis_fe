/* istanbul ignore file */
import React from "react";
import { Helmet } from "react-helmet-async";
import { THEME_COLOR } from "../../constants";

export function RootHelmet() {
  return (
    <Helmet>
      <html lang="en" />

      <meta charSet="utf-8" />

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <meta name="theme-color" content={THEME_COLOR} />

      <meta
        name="description"
        content="Measure everything, record your experiences"
      />
      <meta name="application" content="ebnis" />
    </Helmet>
  );
}
