import { createContext } from "react";
import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import {
  RestoreCacheOrPurgeStorageFn,
  E2EWindowObject,
} from "./state/apollo-setup";
import { CachePersistor } from "apollo-cache-persist";

export interface EbnisContextProps extends E2EWindowObject {
  cache: InMemoryCache;
  client: ApolloClient<{}>;
  restoreCacheOrPurgeStorage?: RestoreCacheOrPurgeStorageFn;
  persistor: CachePersistor<NormalizedCacheObject>;
}

export const EbnisAppContext = createContext<EbnisContextProps>(
  {} as EbnisContextProps,
);

export const EbnisAppProvider = EbnisAppContext.Provider;
