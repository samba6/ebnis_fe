import React from "react";
import { ApolloProvider } from "react-apollo";
import { HelmetProvider } from "react-helmet-async";
import { Workbox } from "workbox-window";

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

export const onServiceWorkerUpdateReady = () => {
  const wb = new Workbox("/sw.js");
  wb.register();

  const answer = window.confirm(
    `This application has been updated. ` +
      `Reload to display the latest version?`
  );

  if (answer === true) {
    wb.addEventListener("controlling", event => {
      window.location.reload();
    });

    wb.messageSW({ type: "SKIP_WAITING" });
  }
};
