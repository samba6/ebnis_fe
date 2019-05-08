import React from "react";
import { Helmet } from "react-helmet-async";
import { SITE_TITLE, THEME_COLOR } from "../../constants";

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
        content="Take control of your wallet, purse. Manage your expenses"
      />
      <meta name="application" content="nina" />

      <title>{SITE_TITLE}</title>
    </Helmet>
  );
}
