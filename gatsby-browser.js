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

  showRefreshUI(wb);
};

function showRefreshUI(wb) {
  const promptUi = document.createElement("div");
  promptUi.classList.add("ui", "inverted", "menu");

  const textNode = document.createTextNode(
    "New content is available. Please click to refresh."
  );

  promptUi.appendChild(textNode);
  promptUi.style.cssText = `
    border: 1px solid #07526f;
    padding: 10px;
    border-radius: 3px;
    color: #ffffffe6;
    background-color: #5faac7;
  `;

  const parent = document.createElement("div");
  parent.style.cssText = `
    cursor: pointer;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 1;
    background: #fdfdfdc2;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  parent.appendChild(promptUi);
  document.body.appendChild(parent);

  function promptUiHandler() {
    wb.addEventListener("controlling", event => {
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
  parent.addEventListener("click", promptUiHandler, false);
}
