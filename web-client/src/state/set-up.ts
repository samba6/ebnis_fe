import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink, Operation } from "apollo-link";
import { onError } from "apollo-link-error";
import { CachePersistor } from "apollo-cache-persist";
import * as AbsintheSocket from "@absinthe/socket";
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link";

import initState, { getToken } from "./resolvers";
import { AppSocket } from "../socket";

let httpLink;
httpLink = createAbsintheSocketLink(AbsintheSocket.create(AppSocket.socket));

httpLink = middlewareAuthLink().concat(httpLink);
httpLink = middlewareErrorLink().concat(httpLink);

if (process.env.NODE_ENV !== "production") {
  httpLink = middlewareLoggerLink(httpLink);
}

const cache = new InMemoryCache();

export const client = new ApolloClient({
  cache,
  link: ApolloLink.from([initState(cache), httpLink])
});

export default client;
const storage = localStorage as any;

const persistor = new CachePersistor({
  cache,
  storage,
  key: "ebnis-apollo-cache-persist"
});

export async function persistCache() {
  const SCHEMA_VERSION = "3.1"; // Must be a string.
  const SCHEMA_VERSION_KEY = "ebnis-apollo-schema-version";
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

export const resetClientAndPersistor = async () => {
  await persistor.pause(); // Pause automatic persistence.
  await persistor.purge(); // Delete everything in the storage provider.
  await client.clearStore();
  await persistor.resume();
};

// HELPER FUNCTIONS

function middlewareAuthLink() {
  return new ApolloLink((operation, forward) => {
    const token = getToken();

    if (token) {
      operation.setContext({
        headers: {
          authorization: `Bearer ${token}`
        }
      });
    }

    return forward ? forward(operation) : null;
  });
}

const getNow = () => {
  const n = new Date();
  return `${n.getHours()}:${n.getMinutes()}:${n.getSeconds()}`;
};

function middlewareLoggerLink(l: ApolloLink) {
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

  return logger.concat(l);
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

    if (response) {
      logError("Response", response);
    }

    if (networkError) {
      logError("Network", networkError);
    }
  });
}
