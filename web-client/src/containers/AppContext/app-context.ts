import React from "react";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { InMemoryCache } from "apollo-cache-inmemory";

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new ApolloLink()
});

export interface AppContextProps {
  showSidebar: boolean;
  onShowSidebar: (showSidebar: boolean) => void;
  setHeader: React.Dispatch<React.SetStateAction<JSX.Element>>;
  header?: JSX.Element;
  reInitSocket: (jwt: string) => void;
  client: ApolloClient<{}>;
  persistCache: () => void;
}

export const AppContext = React.createContext<AppContextProps>({
  showSidebar: false,
  onShowSidebar: () => null,
  setHeader: () => null,
  reInitSocket: () => null,
  persistCache: () => null,
  client
});
