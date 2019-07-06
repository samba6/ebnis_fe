import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { CachePersistor } from "apollo-cache-persist";
import * as AbsintheSocket from "@absinthe/socket";
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link";
import { HttpLink } from "apollo-link-http";
import {
  SCHEMA_KEY,
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
} from "../constants/apollo-schema";
import { getSocket, OnConnectionChanged } from "../socket";
import { initState } from "./resolvers";
import {
  CONNECTION_MUTATION,
  ConnectionStatus,
  ConnectionMutationVariables,
} from "./connection.resolver";
import { PersistentStorage, PersistedData } from "apollo-cache-persist/types";
import {
  E2eOptions,
  MakeSocketLink,
  middlewareErrorLink,
  middlewareLoggerLink,
  middlewareAuthLink,
} from "./apollo-middlewares";
import { CUSTOM_QUERY_RESOLVERS } from "./custom-query-resolvers";

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
}

const onConnChange: OnConnectionChanged = args => {
  client.mutate<ConnectionStatus, ConnectionMutationVariables>({
    mutation: CONNECTION_MUTATION,
    variables: args,
  });
};

export function buildClientCache(
  { uri, headers, isNodeJs, fetch }: BuildClientCache = {} as BuildClientCache,
) {
  if (!cache) {
    cache = new InMemoryCache({
      addTypename: true,

      cacheRedirects: {
        ...CUSTOM_QUERY_RESOLVERS,
      },
    });
  }

  if (!client) {
    let link: ApolloLink;

    if (isNodeJs) {
      /**
       * we do not use phoenix websocket. we use plain http
       */

      link = new HttpLink({
        uri,
        fetch,
      });
    } else {
      const makeSocketLink: MakeSocketLink = (token, forceReconnect) => {
        const absintheSocket = AbsintheSocket.create(
          getSocket({
            onConnChange,
            uri,
            token,
            forceReconnect,
          }),
        );

        return createAbsintheSocketLink(absintheSocket);
      };

      link = middlewareAuthLink(makeSocketLink, headers);
      link = middlewareErrorLink(link);
      link = middlewareLoggerLink(link);
    }

    client = new ApolloClient({
      cache,
      link,
    });

    if (!isNodeJs) {
      const state = initState();

      cache.writeData({
        data: state.defaults,
      });

      client.addResolvers(state.resolvers);

      makePersistor(cache);
      setupE2e();
    }
  }

  return { client, cache, persistor };
}

export type PersistCacheFn = (
  appCache: InMemoryCache,
) => Promise<CachePersistor<NormalizedCacheObject>>;

function makePersistor(appCache: InMemoryCache) {
  persistor = new CachePersistor({
    cache: appCache,
    storage: localStorage as PersistentStorage<
      PersistedData<NormalizedCacheObject>
    >,
    key: SCHEMA_KEY,
    maxSize: false,
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
  appPersistor: CachePersistor<NormalizedCacheObject>,
) => {
  await appPersistor.pause(); // Pause automatic persistence.
  await appPersistor.purge(); // Delete everything in the storage provider.
  await appClient.clearStore();
  await appPersistor.resume();
};

///////////////////// END TO END TESTS THINGS ///////////////////////

function setupE2e() {
  if (window.Cypress) {
    window.Cypress.___e2e = {
      cache,
      client,
      persistor,
      usingWinCache: false,
    };
  }
}

export interface E2EWindowObject {
  cache: InMemoryCache;
  client: ApolloClient<{}>;
  persistor: CachePersistor<NormalizedCacheObject>;
  usingWinCache: boolean;
}

declare global {
  interface Window {
    Cypress: {
      ___e2e: E2EWindowObject;
    };
  }
}
