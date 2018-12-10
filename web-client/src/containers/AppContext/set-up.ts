import { InMemoryCache } from "apollo-cache-inmemory";
import { ApolloClient } from "apollo-client";
import { ApolloLink } from "apollo-link";
import { CachePersistor } from "apollo-cache-persist";
import * as AbsintheSocket from "@absinthe/socket";
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link";

import initState from "../../state/resolvers";
import { getSocket } from "../../socket";
import { middleWares } from "./apollo-middle-wares";

const cache = new InMemoryCache();
let client: ApolloClient<{}>;

export function makeClient(socket = getSocket(), reNew = false) {
  if (client && !reNew) {
    return client;
  }

  const absintheSocket = AbsintheSocket.create(socket);

  let socketLink = middleWares(createAbsintheSocketLink(absintheSocket));

  client = new ApolloClient({
    cache,
    link: ApolloLink.from([initState(cache), socketLink])
  });

  return client;
}

const storage = localStorage as any;

const persistor = new CachePersistor({
  cache,
  storage,
  key: "ebnis-apollo-cache-persist"
});

export async function persistCache() {
  const SCHEMA_VERSION = "1.0"; // Must be a string.
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
