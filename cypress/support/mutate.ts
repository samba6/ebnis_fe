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

const serverUrl = Cypress.env("API_URL") as string;
let client: ApolloClient<{}>;
let persistor: CachePersistor<{}>;

export function mutate<TData, TVariables>(
  options: MutationOptions<TData, TVariables>,
) {
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
  }

  return client.mutate<TData, TVariables>(options);
}

export async function persistCache() {
  if (!persistor) {
    return false;
  }

  localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);

  await persistor.persist();

  return true;
}
