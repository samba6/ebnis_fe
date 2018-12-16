import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink, Operation } from "apollo-link";
import { CachePersistor } from "apollo-cache-persist";
import * as AbsintheSocket from "@absinthe/socket";
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link";
import { onError } from "apollo-link-error";

import { getSocket } from "../socket";
import initState from "../state/resolvers";
import { getToken } from "../state/tokens";
import { SCHEMA_VERSION, SCHEMA_VERSION_KEY, SCHEMA_KEY } from "../constants";
import CONN_MUTATION, { ConnMutData } from "./conn.mutation";

const cache = new InMemoryCache();
let client: ApolloClient<{}>;

function onConnChange(isConnected: boolean) {
  client.mutate<ConnMutData, ConnMutData>({
    mutation: CONN_MUTATION,
    variables: {
      isConnected
    }
  });
}

const absintheSocket = AbsintheSocket.create(getSocket({ onConnChange }));
const socketLink = middleWares(createAbsintheSocketLink(absintheSocket));

client = new ApolloClient({
  cache,
  link: ApolloLink.from([initState(cache), socketLink])
});

// tslint:disable-next-line:no-any
const storage = localStorage as any;

const persistor = new CachePersistor({
  cache,
  storage,
  key: SCHEMA_KEY
});

async function persistCache() {
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

export default function setUp() {
  return { persistCache, client };
}

// export const resetClientAndPersistor = async () => {
//   await persistor.pause(); // Pause automatic persistence.
//   await persistor.purge(); // Delete everything in the storage provider.
//   await client.clearStore();
//   await persistor.resume();
// };

function middleWares(link: ApolloLink) {
  const middlewareAuthLink = new ApolloLink((operation, forward) => {
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

  link = middlewareAuthLink.concat(link);
  link = middlewareErrorLink().concat(link);

  if (process.env.NODE_ENV !== "production") {
    link = middlewareLoggerLink(link);
  }

  return link;
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
