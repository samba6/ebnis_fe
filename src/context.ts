import { createContext } from "react";
import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { PersistCacheFn } from "./state/apollo-setup";

interface EbnisContextProps {
  cache?: InMemoryCache;
  client?: ApolloClient<{}>;
  persistCache?: PersistCacheFn;
}

export const EbnisAppContext = createContext<EbnisContextProps>({});

export const EbnisAppProvider = EbnisAppContext.Provider;
