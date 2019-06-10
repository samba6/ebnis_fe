import { LocalResolverFn } from "./resolvers";
import gql from "graphql-tag";
import { graphql } from "react-apollo";

const CONNECTION_STATUS_ID = "connection-status";

export const DEFAULT_CONNECTION_STATUS: ConnectionStatus = {
  id: CONNECTION_STATUS_ID,
  __typename: "ConnectionStatus" as "ConnectionStatus",
  isConnected: false,
  appNewlyLoaded: true
};

export interface ConnectionStatus {
  id: string;
  __typename: "ConnectionStatus";
  isConnected: boolean;
  appNewlyLoaded: boolean;
}

export interface ConnectionQueryData {
  connected: ConnectionStatus;
}

const CONNECTION_FRAGMENT = gql`
  fragment ConnectionFragment on ConnectionStatus {
    id
    isConnected
    appNewlyLoaded
  }
`;

export const CONNECTION_MUTATION = gql`
  mutation ConnectionMutation($isConnected: Boolean) {
    connected(isConnected: $isConnected) @client {
      ...ConnectionFragment
    }
  }
  ${CONNECTION_FRAGMENT}
`;

export const CONNECTION_QUERY = gql`
  query ConnQuery {
    connected @client {
      ...ConnectionFragment
    }
  }

  ${CONNECTION_FRAGMENT}
`;

export interface ConnectionMutationVariables {
  isConnected: boolean;
}

export const connectionGql = graphql<
  {},
  ConnectionQueryData,
  {},
  ConnectionStatus | undefined
>(CONNECTION_QUERY, {
  props: ({ data }) => {
    if (!data) {
      return undefined;
    }

    return data.connected;
  }
});

export const connectionResolver: LocalResolverFn<
  ConnectionMutationVariables
> = (_, variables, { cache, getCacheKey }) => {
  const id = getCacheKey({
    __typename: "ConnectionStatus",
    id: CONNECTION_STATUS_ID
  });

  const data = cache.readFragment<ConnectionStatus>({
    fragment: CONNECTION_FRAGMENT,
    id
  }) as ConnectionStatus;

  const connected = { ...data, appNewlyLoaded: false };

  const { isConnected } = variables;

  connected.isConnected = isConnected;

  cache.writeData({
    id,
    data: connected
  });

  return connected;
};
