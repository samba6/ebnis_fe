import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient, Resolvers } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { CachePersistor } from "apollo-cache-persist";
import * as AbsintheSocket from "@absinthe/socket";
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link";
import { HttpLink } from "apollo-link-http";
import {
  SCHEMA_KEY,
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY
} from "../constants/apollo-schema";
import { getSocket } from "../socket";
import { initState, LocalState } from "./resolvers";
import {
  CONNECTION_MUTATION,
  ConnectionStatus,
  ConnectionMutationVariables
} from "./connection.resolver";
import { PersistentStorage, PersistedData } from "apollo-cache-persist/types";
import {
  E2eOptions,
  MakeSocketLink,
  middlewareErrorLink,
  middlewareLoggerLink,
  middlewareAuthLink
} from "./apollo-middlewares";

let cache: InMemoryCache;
let client: ApolloClient<{}>;
let persistor: CachePersistor<NormalizedCacheObject>;

interface BuildClientCache extends E2eOptions {
  uri?: string;

  headers?: { [k: string]: string };

  /**
   * are we server side rendering?
   */
  isNodeJs?: boolean;

  fetch?: GlobalFetch["fetch"];

  resolvers?: Resolvers[];
}

function onConnChange(isConnected: boolean) {
  client.mutate<ConnectionStatus, ConnectionMutationVariables>({
    mutation: CONNECTION_MUTATION,
    variables: {
      isConnected
    }
  });
}

export function buildClientCache(
  {
    uri,
    headers,
    isNodeJs,
    fetch,
    resolvers,
    ...e2eOptions
  }: BuildClientCache = {} as BuildClientCache
) {
  if (!cache) {
    cache = new InMemoryCache({
      addTypename: true
    });
  }

  if (!client) {
    let defaultResolvers = (resolvers || []) as Resolvers[];
    let defaultState = {} as LocalState;
    let link: ApolloLink;

    if (isNodeJs) {
      /**
       * we do not use phoenix websocket. we use plain http
       */

      link = new HttpLink({
        uri,
        fetch
      });
    } else {
      const makeSocketLink: MakeSocketLink = (token, forceReconnect) => {
        const absintheSocket = AbsintheSocket.create(
          getSocket({
            onConnChange,
            uri,
            token,
            forceReconnect
          })
        );

        return createAbsintheSocketLink(absintheSocket);
      };

      link = middlewareAuthLink(makeSocketLink, headers);
      link = middlewareErrorLink(link, e2eOptions);
      link = middlewareLoggerLink(link, e2eOptions);

      const state = initState();
      defaultResolvers = defaultResolvers.concat(state.resolvers);
      defaultState = state.defaults;
    }

    client = new ApolloClient({
      cache,
      link,
      resolvers: defaultResolvers
    });

    if (!isNodeJs) {
      cache.writeData({
        data: defaultState
      });

      makePersistor(cache);
    }
  }

  return { client, cache, persistor };
}

export type PersistCacheFn = (
  appCache: InMemoryCache
) => Promise<CachePersistor<NormalizedCacheObject>>;

function makePersistor(appCache: InMemoryCache) {
  persistor = new CachePersistor({
    cache: appCache,
    storage: localStorage as PersistentStorage<
      PersistedData<NormalizedCacheObject>
    >,
    key: SCHEMA_KEY,
    maxSize: false
  });

  return persistor;
}

export async function persistCache(appCache: InMemoryCache) {
  if (!persistor) {
    persistor = makePersistor(appCache);
  }

  const currentVersion = localStorage.getItem(SCHEMA_VERSION_KEY);

  if (currentVersion === SCHEMA_VERSION) {
    // If the current version matches the latest version,
    // we're good to go and can restore the cache.
    await persistor.restore();
  } else {
    // Otherwise, we'll want to purge the outdated persisted cache
    // and mark ourselves as having updated to the latest version.
    await persistor.purge();
    localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
  }

  setTimeout(() => {
    // These are old keys. We simply need to get rid of them on all clients.
    // We will get rid of this code sometime later.
    localStorage.removeItem("ebnis-token-key");
    localStorage.removeItem("ebnis-apollo-schema-version");
    localStorage.removeItem("ebnis-apollo-cache-persist");
  });

  return persistor;
}

export const resetClientAndPersistor = async (
  appClient: ApolloClient<{}>,
  appPersistor: CachePersistor<NormalizedCacheObject>
) => {
  await appPersistor.pause(); // Pause automatic persistence.
  await appPersistor.purge(); // Delete everything in the storage provider.
  await appClient.clearStore();
  await appPersistor.resume();
};
