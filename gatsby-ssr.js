import React from "react";
import { ApolloProvider } from "react-apollo";
import { HelmetProvider } from "react-helmet-async";
import fetch from "isomorphic-fetch";

import { buildClientCache } from "./src/state/apollo-setup";
import { EbnisAppProvider } from "./src/context";
import { RootHelmet } from "./src/components/RootHelmet";

const helmetContext = {};

export const wrapRootElement = ({ element }) => {
  const { client } = buildClientCache({
    isNodeJs: true,
    uri: "/",
    fetch
  });

  return (
    <ApolloProvider client={client}>
      <EbnisAppProvider
        value={{
          client
        }}
      >
        <HelmetProvider context={helmetContext}>
          <RootHelmet />

          {element}
        </HelmetProvider>
      </EbnisAppProvider>
    </ApolloProvider>
  );
};

export const onRenderBody = args => {
  setupHelmet(args);
};

function setupHelmet({
  setHeadComponents,
  setHtmlAttributes,
  setBodyAttributes
}) {
  const { helmet } = helmetContext;

  // available only in production build.
  if (helmet == null) {
    return;
  }

  setHeadComponents([
    helmet.base.toComponent(),
    helmet.title.toComponent(),
    helmet.meta.toComponent(),
    helmet.link.toComponent(),
    helmet.style.toComponent(),
    helmet.script.toComponent(),
    helmet.noscript.toComponent()
  ]);

  setHtmlAttributes(helmet.htmlAttributes.toComponent());
  setBodyAttributes(helmet.bodyAttributes.toComponent());
}
