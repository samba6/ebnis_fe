import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import { ApolloClient, Resolvers } from "apollo-client";
import { ApolloLink, Operation } from "apollo-link";
import { CachePersistor } from "apollo-cache-persist";
import * as AbsintheSocket from "@absinthe/socket";
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link";
import { onError } from "apollo-link-error";
import { HttpLink } from "apollo-link-http";

import { getSocket } from "../socket";
import { initState, LocalState } from "./resolvers";
import { getToken } from "./tokens";
import { SCHEMA_VERSION, SCHEMA_VERSION_KEY, SCHEMA_KEY } from "../constants";
import CONN_MUTATION, {
  ConnectionMutationData,
  ConnectionMutationVariables
} from "./conn.mutation";

let cache: InMemoryCache;
let client: ApolloClient<{}>;
let persistor: CachePersistor<NormalizedCacheObject>;

interface BuildClientCache {
  uri?: string;

  headers?: { [k: string]: string };

  /**
   * are we server side rendering?
   */
  isNodeJs?: boolean;

  fetch?: GlobalFetch["fetch"];

  forceSocketConnection?: boolean;
}

function onConnChange(isConnected: boolean) {
  client.mutate<ConnectionMutationData, ConnectionMutationVariables>({
    mutation: CONN_MUTATION,
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
    forceSocketConnection
  }: BuildClientCache = {} as BuildClientCache
) {
  if (!cache) {
    cache = new InMemoryCache({
      addTypename: true
    });
  }

  if (forceSocketConnection || !client) {
    let resolvers = {} as Resolvers;
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

      const absintheSocket = AbsintheSocket.create(
        getSocket({
          onConnChange,
          uri,
          token: apolloHeaders.jwt
        })
      );

      link = createAbsintheSocketLink(absintheSocket);
      link = middlewareAuthLink(apolloHeaders).concat(link);
      link = middlewareErrorLink().concat(link);
      link = middlewareLoggerLink(link);

      const state = initState();
      resolvers = state.resolvers;
      defaultState = state.defaults;
    }

    client = new ApolloClient({
      cache,
      link,
      resolvers
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

export async function persistCache(appCache: InMemoryCache) {
  if (!persistor) {
    persistor = new CachePersistor({
      cache: appCache,
      // tslint:disable-next-line: no-any
      storage: localStorage as any,
      key: SCHEMA_KEY
    });

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

function middlewareAuthLink(headers: { [k: string]: string } = {}) {
  return new ApolloLink((operation, forward) => {
    const token = headers.jwt || getToken();

    if (token) {
      headers.authorization = `Bearer ${token}`;
    }

    operation.setContext({
      headers
    });

    return forward ? forward(operation) : null;
  });
}

const getNow = () => {
  const n = new Date();
  return `${n.getHours()}:${n.getMinutes()}:${n.getSeconds()}`;
};

function middlewareLoggerLink(link: ApolloLink) {
  if (process.env.NODE_ENV === "production") {
    return link;
  }

  const processOperation = (operation: Operation) => ({
    query: operation.query.loc ? operation.query.loc.source.body : "",
    variables: operation.variables
  });

  const logger = new ApolloLink((operation, forward) => {
    const operationName = `Apollo operation: ${operation.operationName}`;

    // tslint:disable-next-line:no-console
    console.log(
      "\n\n\n",
      getNow(),
      `=============================${operationName}========================\n`,
      processOperation(operation),
      `\n=========================End ${operationName}=========================`
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
          `==============Received response from ${operationName}============\n`,
          response,
          `\n==========End Received response from ${operationName}=============`
        );
        return response;
      });
    }

    return fop;
  });

  return logger.concat(link);
}

function middlewareErrorLink() {
  return onError(({ graphQLErrors, networkError, response, operation }) => {
    // tslint:disable-next-line:ban-types
    const logError = (errorName: string, obj: Object) => {
      if (process.env.NODE_ENV === "production") {
        return;
      }

      const operationName = `[${errorName} error] from Apollo operation: ${
        operation.operationName
      }`;

      // tslint:disable-next-line:no-console
      console.error(
        "\n\n\n",
        getNow(),
        `============================${operationName}=======================\n`,
        obj,
        `\n====================End ${operationName}============================`
      );
    };

    if (graphQLErrors) {
      logError("Response", graphQLErrors);
    }

    if (response) {
      logError("Response", response);
    }

    if (networkError) {
      logError("Network", networkError);
    }
  });
}
