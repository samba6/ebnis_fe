import React from "react";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { ApolloProvider } from "react-apollo";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";

export function renderWithApollo(ui: JSX.Element) {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink()
  });

  return {
    client,
    ui: <ApolloProvider client={client}>{ui}</ApolloProvider>
  };
}

export function renderWithRouter(
  ui: JSX.Element,
  {
    route = "/",
    history = createMemoryHistory({ initialEntries: [route] })
  } = {}
) {
  return {
    // adding `history` to the returned utilities to allow us
    // to reference it in our tests (just try to avoid using
    // this to test implementation details).
    history,
    ui: <Router history={history}>{ui}</Router>
  };
}
