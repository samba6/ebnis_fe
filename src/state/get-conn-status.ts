import { ApolloClient } from "apollo-client";

import { CONNECTION_QUERY, ConnectionQueryData } from "./conn.query";

export async function getConnStatus(client: ApolloClient<{}>) {
  const { data } = await client.query<ConnectionQueryData>({
    query: CONNECTION_QUERY
  });

  if (!data) {
    return false;
  }

  const { connected } = data;

  if (!connected) {
    return false;
  }

  return connected.isConnected;
}
