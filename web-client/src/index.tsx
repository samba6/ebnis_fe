import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from "react-apollo";
import "semantic-ui-css-offline";

import "./index.scss";
import App from "./containers/App";
import * as serviceWorker from "./serviceWorker";
import setUp from "./state/apollo-set-up";

const { persistCache, client } = setUp();

ReactDOM.render(
  <ApolloProvider client={client}>
    <App persistCache={persistCache} />
  </ApolloProvider>,

  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
