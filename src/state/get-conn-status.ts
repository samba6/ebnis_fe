import { ApolloClient } from "apollo-client";

import { CONNECTION_QUERY, ConnectionQueryData } from "./connection.resolver";
import { getManualConnectionStatus } from "../test-utils/manual-connection-setting";

export async function getConnStatus(client: ApolloClient<{}>) {
  const isManualConnected = getManualConnectionStatus();

  // we give connection status we set (in tests) ourselves priority over that
  // set by phoenix socket `isManualConnected !== null` implies we have
  // manually set the connection status
  if (isManualConnected !== null) {
    return isManualConnected;
  }

  const { data } = await client.query<ConnectionQueryData>({
    query: CONNECTION_QUERY,
  });

  if (!data) {
    return false;
  }

  const { connected } = data;

  if (!connected) {
    return false;
  }

  const { isConnected } = connected;

  return isConnected;
}
