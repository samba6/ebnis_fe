/* eslint-disable @typescript-eslint/no-explicit-any */
import ApolloClient from "apollo-client";
import { CachePersistor } from "apollo-cache-persist";
import { MutationOptions } from "apollo-client/core/watchQueryOptions";
import {
  buildClientCache,
  CYPRESS_APOLLO_KEY,
  CYPRESS_ENV_TEST_STARTS_KEY,
} from "../../src/state/apollo-setup";
import { allResolvers } from "../../src/state/all-resolvers";
import { USER_JWT_ENV } from "./constants";

export function mutate<TData, TVariables>(
  options: MutationOptions<TData, TVariables>,
) {
  let client: ApolloClient<{}>;

  const cypressApollo = Cypress.env(CYPRESS_APOLLO_KEY);

  if (cypressApollo) {
    client = cypressApollo.client;
  }

  if (Cypress.env(CYPRESS_ENV_TEST_STARTS_KEY) || !client) {
    const apolloSetup = buildClientCache({
      uri: Cypress.env("API_URL"),
      headers: {
        jwt: Cypress.env(USER_JWT_ENV),
      },

      resolvers: allResolvers,
    });

    client = apolloSetup.client;
  }

  return client.mutate<TData, TVariables>(options);
}

export async function persistCache() {
  let persistor: CachePersistor<{}>;

  const cypressApollo = Cypress.env(CYPRESS_APOLLO_KEY);

  persistor = cypressApollo.persistor;

  await persistor.persist();
}
