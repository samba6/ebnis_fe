import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { CachePersistor } from "apollo-cache-persist";
import * as AbsintheSocket from "@absinthe/socket";
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link";
import {
  SCHEMA_KEY,
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
} from "../constants/apollo-schema";
import { getSocket } from "../socket";
import { initState } from "./resolvers";
import { PersistentStorage, PersistedData } from "apollo-cache-persist/types";
import {
  MakeSocketLinkFn,
  middlewareErrorLink,
  middlewareLoggerLink,
  middlewareAuthLink,
} from "./apollo-middlewares";
import { CUSTOM_QUERY_RESOLVERS } from "./custom-query-resolvers";
import {
  ConnectionStatus,
  makeConnectionObject,
  resetConnectionObject,
} from "./connections";

export function buildClientCache(
  { uri, resolvers, newE2eTest }: BuildClientCache = {} as BuildClientCache,
) {
  // use cypress version of cache if it has been set by cypress
  let { cache, persistor } = fromGlobals(newE2eTest);

  if (!cache) {
    cache = new InMemoryCache({
      addTypename: true,

      cacheRedirects: {
        ...CUSTOM_QUERY_RESOLVERS,
      },
    }) as InMemoryCache;
  }

  persistor = makePersistor(cache, persistor);

  const makeSocketLink: MakeSocketLinkFn = makeSocketLinkArgs => {
    const absintheSocket = AbsintheSocket.create(
      getSocket({
        uri,
        ...makeSocketLinkArgs,
      }),
    );

    return createAbsintheSocketLink(absintheSocket);
  };

  let link = middlewareAuthLink(makeSocketLink);
  link = middlewareErrorLink(link);
  link = middlewareLoggerLink(link);

  const client = new ApolloClient({
    cache,
    link,
  }) as ApolloClient<{}>;

  const state = initState();

  cache.writeData({
    data: state.defaults,
  });

  client.addResolvers(state.resolvers);

  if (resolvers) {
    client.addResolvers(resolvers);
  }

  addToGlobals({ client, cache, persistor });

  return { client, cache, persistor };
}

export type RestoreCacheOrPurgeStorageFn = (
  persistor: CachePersistor<{}>,
) => Promise<CachePersistor<{}>>;

function makePersistor(
  appCache: InMemoryCache,
  persistor?: CachePersistor<{}>,
) {
  persistor = persistor
    ? persistor
    : (new CachePersistor({
        cache: appCache,
        storage: localStorage as PersistentStorage<PersistedData<{}>>,
        key: SCHEMA_KEY,
        maxSize: false,
      }) as CachePersistor<{}>);

  return persistor;
}

export async function restoreCacheOrPurgeStorage(
  persistor: CachePersistor<{}>,
) {
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

  return persistor;
}

export const resetClientAndPersistor = async (
  appClient: ApolloClient<{}>,
  appPersistor: CachePersistor<{}>,
) => {
  await appPersistor.pause(); // Pause automatic persistence.
  await appPersistor.purge(); // Delete everything in the storage provider.
  await appClient.clearStore();
  await appPersistor.resume();
};

interface BuildClientCache {
  uri?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolvers: any;

  newE2eTest?: boolean;
}

///////////////////// END TO END TESTS THINGS ///////////////////////

export const CYPRESS_APOLLO_KEY = "ebnis-cypress-apollo";

function fromGlobals(newE2eTest?: boolean) {
  if (!window.____ebnis) {
    window.____ebnis = {} as E2EWindowObject;
  }

  if (!window.Cypress) {
    makeConnectionObject();
    return window.____ebnis;
  }

  let cypressApollo = window.Cypress.env(CYPRESS_APOLLO_KEY) as E2EWindowObject;

  if (newE2eTest) {
    // We need to set up local storage for local state management
    // so that whatever we persist in e2e tests will be picked up by apollo
    // when app starts. Otherwise, apollo will always clear out the local
    // storage when the app starts if it can not read the schema version.
    localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
    cypressApollo = {} as E2EWindowObject;
    cypressApollo.connectionStatus = resetConnectionObject();
  }

  window.____ebnis = cypressApollo;
  window.Cypress.env(CYPRESS_APOLLO_KEY, cypressApollo);

  return cypressApollo;
}

export function addToGlobals(args: {
  client: ApolloClient<{}>;
  cache: InMemoryCache;
  persistor: CachePersistor<{}>;
}) {
  if (window.Cypress) {
    let cypressApollo = window.Cypress.env(
      CYPRESS_APOLLO_KEY,
    ) as E2EWindowObject;

    cypressApollo.client = args.client;
    cypressApollo.cache = args.cache;
    cypressApollo.persistor = args.persistor;

    window.Cypress.env(CYPRESS_APOLLO_KEY, cypressApollo);

    window.____ebnis = cypressApollo;
  } else {
    const globals = window.____ebnis;
    globals.persistor = args.persistor;
    globals.cache = args.cache;
    globals.client = args.client;
  }
}

export interface E2EWindowObject {
  cache: InMemoryCache;
  client: ApolloClient<{}>;
  persistor: CachePersistor<{}>;
  connectionStatus: ConnectionStatus;
}

declare global {
  interface Window {
    Cypress: {
      env: <T>(k?: string, v?: T) => void | T;
    };

    ____ebnis: E2EWindowObject;
  }
}
