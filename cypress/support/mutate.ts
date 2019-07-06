/* eslint-disable @typescript-eslint/no-explicit-any */
import ApolloClient from "apollo-client";
import { CachePersistor } from "apollo-cache-persist";
import { MutationOptions } from "apollo-client/core/watchQueryOptions";
import {
  buildClientCache,
  CYPRESS_APOLLO_KEY,
} from "../../src/state/apollo-setup";
import { allResolvers } from "../../src/state/all-resolvers";
import { USER_JWT_ENV } from "./constants";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
} from "../../src/constants/apollo-schema";

const serverUrl = Cypress.env("API_URL") as string;
let client: ApolloClient<{}>;
let persistor: CachePersistor<{}>;
let cache: InMemoryCache;

export function mutate<TData, TVariables>(
  options: MutationOptions<TData, TVariables>,
) {
  const cypressApollo = Cypress.env(CYPRESS_APOLLO_KEY);

  if (cypressApollo) {
    client = cypressApollo.client;
    persistor = cypressApollo.persistor;
    cache = cypressApollo.cache;
  }

  if (!client) {
    const apolloSetup = buildClientCache({
      uri: serverUrl,
      headers: {
        jwt: Cypress.env(USER_JWT_ENV),
      },

      resolvers: allResolvers,
    });

    client = apolloSetup.client;
    persistor = apolloSetup.persistor;
    cache = apolloSetup.cache;
  }

  return client.mutate<TData, TVariables>(options);
}

export async function persistCache(customPersistor?: CachePersistor<{}>) {
  // we need to set up local storage for local state management
  // so that whatever we persist in this test will be picked up by apollo
  // when app starts. Otherwise, apollo will always clear out the local
  // storage when the app starts if it can not read the schema version.
  localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);

  persistor = customPersistor || persistor;

  if (!persistor) {
    throw new Error("Persistor unavailable");
  }

  await persistor.persist();

  return cache;
}
