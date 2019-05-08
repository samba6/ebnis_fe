import React from "react";
import { ApolloProvider } from "react-apollo";
import { HelmetProvider } from "react-helmet-async";

import "./src/styles/semantic-theme/semantic.less";
import "./src/styles/globals.scss";
import { buildClientCache, persistCache } from "./src/state/apollo-setup";
import { EbnisAppProvider } from "./src/context";
import { RootHelmet } from "./src/components/RootHelmet";

export const wrapRootElement = ({ element }) => {
  const { client, cache } = buildClientCache();

  return (
    <ApolloProvider client={client}>
      <EbnisAppProvider
        value={{
          client,
          cache,
          persistCache
        }}
      >
        <HelmetProvider>
          <RootHelmet />

          {element}
        </HelmetProvider>
      </EbnisAppProvider>
    </ApolloProvider>
  );
};
