import { createContext } from "react";
import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { PersistCacheFn } from "./state/apollo-setup";
import { CachePersistor } from "apollo-cache-persist";

export interface EbnisContextProps {
  cache?: InMemoryCache;
  client?: ApolloClient<{}>;
  persistCache?: PersistCacheFn;
  persistor?: CachePersistor<NormalizedCacheObject>;
}

export const EbnisAppContext = createContext<EbnisContextProps>({});

export const EbnisAppProvider = EbnisAppContext.Provider;
