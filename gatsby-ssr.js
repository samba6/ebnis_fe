/* eslint-disable react/prop-types */
import React from "react";
import { ApolloProvider } from "@apollo/react-hooks";
import { HelmetProvider } from "react-helmet-async";
import { EbnisAppProvider } from "./src/context";
import { RootHelmet } from "./src/components/RootHelmet";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { HttpLink } from "apollo-link-http";

const helmetContext = {};

export const wrapRootElement = ({ element }) => {
  const cache = new InMemoryCache();

  const link = new HttpLink({
    uri: "/",
    fetch: () => null,
  });

  const client = new ApolloClient({
    cache,
    link,
  });

  return (
    <ApolloProvider client={client}>
      <EbnisAppProvider
        value={{
          client,
          connectionStatus: {},
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
  setBodyAttributes,
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
    helmet.noscript.toComponent(),
  ]);

  setHtmlAttributes(helmet.htmlAttributes.toComponent());
  setBodyAttributes(helmet.bodyAttributes.toComponent());
}
