import ApolloClient from "apollo-client";
import { CachePersistor } from "apollo-cache-persist";
import { MutationOptions } from "apollo-client/core/watchQueryOptions";
import { buildClientCache } from "../../src/state/apollo-setup";
import { allResolvers } from "../../src/state/all-resolvers";
import { USER_JWT_ENV } from "./constants";
import {
  SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
} from "../../src/constants/apollo-schema";
import { InMemoryCache } from "apollo-cache-inmemory";

const serverUrl = Cypress.env("API_URL") as string;
let client: ApolloClient<{}>;
let persistor: CachePersistor<{}>;
let cache: InMemoryCache;

export function mutate<TData, TVariables>(
  options: MutationOptions<TData, TVariables>,
) {
  const { ___e2e } = window.Cypress;

  if (___e2e) {
    client = ___e2e.client;
    client.addResolvers(allResolvers);
    persistor = ___e2e.persistor;
    cache = ___e2e.cache;
  }

  if (!client) {
    const apolloSetup = buildClientCache({
      uri: serverUrl,
      headers: {
        jwt: Cypress.env(USER_JWT_ENV),
      },
      isE2e: true,
    });

    client = apolloSetup.client;
    client.addResolvers(allResolvers);
    persistor = apolloSetup.persistor;
    cache = apolloSetup.cache;
  }

  return client.mutate<TData, TVariables>(options);
}

export async function persistCache(customPersistor?: CachePersistor<{}>) {
  persistor = customPersistor || persistor;

  if (!persistor) {
    throw new Error("Persistor unavailable");
  }

  localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);

  await persistor.persist();

  return cache;
}
