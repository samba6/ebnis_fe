import React, { FunctionComponent, ComponentClass } from "react";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { ApolloProvider } from "react-apollo";
import { Router } from "react-router-dom";
import { createMemoryHistory, History } from "history";

export function makeClient() {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink()
  });
}

export function renderWithApollo(ui: JSX.Element) {
  const client = makeClient();

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

interface HistoryProps {
  push?: (path: string) => void;
  path?: string;
}

const defaultHistoryProps: HistoryProps = {
  push: jest.fn()
};

export function makeHistory(params: HistoryProps = defaultHistoryProps) {
  const history = createMemoryHistory({
    initialEntries: [params.path || "/"]
  });

  return { ...history, ...params };
}

export function testWithRouter<TProps>(
  Ui:
    | FunctionComponent<TProps & { history: History }>
    | ComponentClass<TProps & { history: History }>,
  historyProps?: HistoryProps
) {
  const history = makeHistory(historyProps) as History;

  return {
    // adding `history` to the returned utilities to allow us
    // to reference it in our tests (just try to avoid using
    // this to test implementation details).
    history,
    Ui: (props: TProps) => {
      return (
        <Router history={history}>
          <Ui history={history} {...props} />
        </Router>
      );
    }
  };
}

export function testWithApollo<TProps>(
  Ui: FunctionComponent<TProps & { client: ApolloClient<{}> }>
) {
  const client = makeClient();

  return {
    client,
    Ui: (props: TProps) => (
      <ApolloProvider client={client}>
        <Ui client={client} {...props} />
      </ApolloProvider>
    )
  };
}
