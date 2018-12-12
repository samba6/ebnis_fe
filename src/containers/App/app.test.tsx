import React from "react";
import "jest-dom/extend-expect";
import "react-testing-library/cleanup-after-each";
import { render } from "react-testing-library";
import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloLink } from "apollo-link";
import { ApolloProvider } from "react-apollo";

import App from "./app-x";

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new ApolloLink()
});

it("renders without crashing", () => {
  const mockedPersistCache = jest.fn();

  const Component = (
    <ApolloProvider client={client}>
      <App persistCache={mockedPersistCache} />
    </ApolloProvider>
  );

  const { rerender, container, getByTestId } = render(Component);

  const { firstChild: app } = container;
  expect(app).toContainElement(getByTestId("loading-spinner"));

  const $title = getByTestId("app-header-title");
  expect(app).toContainElement($title);
  expect($title.textContent).toBe("");

  // we need to re-render so react can flush all effects
  rerender(Component);
  expect(mockedPersistCache.mock.calls.length).toBe(1);
});
