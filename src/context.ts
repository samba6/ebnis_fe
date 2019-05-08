import { createContext, useState, useEffect, useContext } from "react";
import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { PersistCacheFn } from "./state/apollo-setup";

interface NinaContextProps {
  cache?: InMemoryCache;
  client?: ApolloClient<{}>;
  persistCache?: PersistCacheFn;
}

export const EbnisAppContext = createContext<NinaContextProps>({});

export const EbnisAppProvider = EbnisAppContext.Provider;

export function useSetupCachePersistor() {
  const { cache, persistCache } = useContext(EbnisAppContext);

  if (!(cache && persistCache)) {
    return null;
  }

  const [loadingCache, setLoadingCache] = useState(false);

  useEffect(function PersistCache() {
    (async function doPersistCache() {
      try {
        await persistCache(cache);
        setLoadingCache(true);
      } catch (error) {
        return error;
      }
    })();
  }, []);

  return loadingCache;
}
