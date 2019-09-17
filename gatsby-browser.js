/* eslint-disable react/prop-types */
import React from "react";
import { ApolloProvider } from "@apollo/react-hooks";
import { HelmetProvider } from "react-helmet-async";
import { Workbox } from "workbox-window";

import "./src/styles/semantic-theme/semantic.less";
import "./src/styles/globals.scss";
import {
  buildClientCache,
  restoreCacheOrPurgeStorage,
} from "./src/state/apollo-setup";
import { EbnisAppProvider } from "./src/context";
import { RootHelmet } from "./src/components/RootHelmet";

export const wrapRootElement = ({ element }) => {
  const { client, cache, persistor } = buildClientCache({
    appHydrated: true,
  });

  return (
    <ApolloProvider client={client}>
      <EbnisAppProvider
        value={{
          client,
          cache,
          restoreCacheOrPurgeStorage,
          persistor,
          ...window.____ebnis,
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

  showRefreshUI(wb);
};

function showRefreshUI(wb) {
  const promptUi = document.createElement("div");
  promptUi.classList.add("ui", "inverted", "menu");

  const textNode = document.createTextNode(
    "New content is available. Please click to refresh.",
  );

  promptUi.appendChild(textNode);
  promptUi.style.cssText = `
    border: 1px solid #07526f;
    padding: 10px;
    border-radius: 3px;
    color: #ffffffe6;
    background-color: #5faac7;
  `;

  const promptWrapper = document.createElement("div");
  promptWrapper.style.cssText = `
    position: absolute;
    bottom: 15px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const container = document.createElement("div");
  container.style.cssText = `
    cursor: pointer;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 1;
    background: #fdfdfdc2;
  `;

  promptWrapper.appendChild(promptUi);
  container.appendChild(promptWrapper);
  document.body.appendChild(container);

  function promptUiHandler() {
    wb.addEventListener("controlling", () => {
      window.location.reload();
    });

    wb.messageSW({ type: "SKIP_WAITING" });
  }

  // TODO: make it so that if parent is clicked then the user does not want
  // to accept the update. We will show a UI to tell user there is an update
  // pending so he can accept it at some later time
  // function parentHandler() {
  //   promptUi.removeEventListener("click", promptUiHandler, false);
  //   parent.removeEventListener("click", parentHandler, false);

  //   promptUi.remove();
  //   parent.remove();
  // }

  // promptUi.addEventListener("click", promptUiHandler, false);
  container.addEventListener("click", promptUiHandler, false);
}
