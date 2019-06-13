import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient, Resolvers } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { CachePersistor } from "apollo-cache-persist";
import * as AbsintheSocket from "@absinthe/socket";
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link";
import { onError } from "apollo-link-error";
import { HttpLink } from "apollo-link-http";
import {
  SCHEMA_KEY,
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY
} from "../constants/apollo-schema";
import { getSocket } from "../socket";
import { initState, LocalState } from "./resolvers";
import { getToken } from "./tokens";
import {
  CONNECTION_MUTATION,
  ConnectionStatus,
  ConnectionMutationVariables
} from "./connection.resolver";
import { PersistentStorage, PersistedData } from "apollo-cache-persist/types";

let cache: InMemoryCache;
let client: ApolloClient<{}>;
let persistor: CachePersistor<NormalizedCacheObject>;

interface E2eOptions {
  isE2e?: boolean;
}

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

type MakeSocketLink = (token: string, forceReconnect?: boolean) => ApolloLink;

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
      const apolloHeaders = headers || {};

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

      link = middlewareAuthLink(makeSocketLink, apolloHeaders);
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
    }
  }

  return { client, cache };
}

export default buildClientCache;

export type PersistCacheFn = (
  appCache: InMemoryCache
) => Promise<CachePersistor<NormalizedCacheObject>>;

export function makePersistor(appCache: InMemoryCache) {
  return new CachePersistor({
    cache: appCache,
    storage: localStorage as PersistentStorage<
      PersistedData<NormalizedCacheObject>
    >,
    key: SCHEMA_KEY,
    maxSize: false
  });
}

export async function persistCache(appCache: InMemoryCache) {
  if (!persistor) {
    persistor = makePersistor(appCache);

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
  }

  setTimeout(() => {
    // These are old keys. We simply need to get rid of them on all clients.
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

function middlewareAuthLink(
  makeSocketLink: MakeSocketLink,
  headers: { [k: string]: string } = {}
) {
  let previousToken = getToken();
  let socketLink = makeSocketLink(previousToken);

  return new ApolloLink((operation, forward) => {
    const token = getToken();

    if (token !== previousToken) {
      previousToken = token;
      socketLink = makeSocketLink(token, true);
    }

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    operation.setContext({
      headers
    });

    return socketLink.request(operation, forward);
  });
}

const getNow = () => {
  const n = new Date();
  return `${n.getHours()}:${n.getMinutes()}:${n.getSeconds()}:${n.getMilliseconds()}`;
};

function middlewareLoggerLink(link: ApolloLink, { isE2e }: E2eOptions = {}) {
  let loggerLink = new ApolloLink((operation, forward) => {
    const operationName = `Apollo operation: ${operation.operationName}`;

    // tslint:disable-next-line:no-console
    console.log(
      "\n\n\n",
      getNow(),
      `\n====${operationName}===\n\n`,
      {
        query: operation.query.loc ? operation.query.loc.source.body : "",
        variables: operation.variables
      },
      `\n\n===End ${operationName}====`
    );

    if (!forward) {
      return null;
    }

    const fop = forward(operation);

    if (fop.map) {
      return fop.map(response => {
        // tslint:disable-next-line:no-console
        console.log(
          "\n\n\n",
          getNow(),
          `\n=Received response from ${operationName}=\n\n`,
          response,
          `\n\n=End Received response from ${operationName}=`
        );
        return response;
      });
    }

    return fop;
  }).concat(link);

  if (isE2e) {
    return loggerLink;
  }

  if (process.env.NODE_ENV === "production") {
    loggerLink = null;
    return link;
  }

  return loggerLink;
}

function middlewareErrorLink(link: ApolloLink, { isE2e }: E2eOptions = {}) {
  let errorLink = onError(
    ({ graphQLErrors, networkError, response, operation }) => {
      const logError = (errorName: string, obj: object) => {
        const operationName = `[${errorName} error] from Apollo operation: ${
          operation.operationName
        }`;

        // tslint:disable-next-line:no-console
        console.error(
          "\n\n\n",
          getNow(),
          `\n=${operationName}=\n\n`,
          obj,
          `\n\n=End ${operationName}=`
        );
      };

      if (graphQLErrors) {
        logError("Response graphQLErrors", graphQLErrors);
      }

      if (response) {
        logError("Response", response);
      }

      if (networkError) {
        logError("Response Network Error", networkError);
      }
    }
  ).concat(link);

  if (isE2e) {
    return errorLink;
  }

  if (process.env.NODE_ENV === "production") {
    errorLink = null;
    return link;
  }

  return errorLink;
}
