import React from "react";
import { ApolloProvider } from "react-apollo";
import { HelmetProvider } from "react-helmet-async";
import fetch from "isomorphic-fetch";

import { buildClientCache } from "./src/state/apollo-setup";
import { EbnisAppProvider } from "./src/context";
import { RootHelmet } from "./src/components/RootHelmet";

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
        <HelmetProvider>
          <RootHelmet />

          {element}
        </HelmetProvider>
      </EbnisAppProvider>
    </ApolloProvider>
  );
};
