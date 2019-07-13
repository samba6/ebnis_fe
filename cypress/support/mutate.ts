/* eslint-disable @typescript-eslint/no-explicit-any */
import ApolloClient from "apollo-client";
import { CachePersistor } from "apollo-cache-persist";
import { MutationOptions } from "apollo-client/core/watchQueryOptions";
import { CYPRESS_APOLLO_KEY } from "../../src/state/apollo-setup";

export function mutate<TData, TVariables>(
  options: MutationOptions<TData, TVariables>,
) {
  return (Cypress.env(CYPRESS_APOLLO_KEY).client as ApolloClient<{}>).mutate<
    TData,
    TVariables
  >(options);
}

export async function persistCache() {
  await (Cypress.env(CYPRESS_APOLLO_KEY)
    .persistor as CachePersistor<{}>).persist();
}
