import { LocalResolverFn } from "./resolvers";
import gql from "graphql-tag";
import { graphql } from "react-apollo";

const CONNECTION_STATUS_ID = "connection-status";

export const DEFAULT_CONNECTION_STATUS: ConnectionStatus = {
  id: CONNECTION_STATUS_ID,
  __typename: "ConnectionStatus" as "ConnectionStatus",
  isConnected: false,
  reconnected: "false",
};

export interface ConnectionStatus {
  id: string;
  __typename: "ConnectionStatus";
  isConnected: boolean;
  reconnected: string;
}

export interface ConnectionQueryData {
  connected: ConnectionStatus;
}

const CONNECTION_FRAGMENT = gql`
  fragment ConnectionFragment on ConnectionStatus {
    id
    isConnected
    reconnected
  }
`;

export const CONNECTION_MUTATION = gql`
  mutation ConnectionMutation($isConnected: Boolean!, $reconnected: String!) {
    connected(isConnected: $isConnected, reconnected: $reconnected) @client {
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
  reconnected: string;
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
  },
});

export const CONNECTION_SUBSCRIPTION = gql`
  subscription ConnectionChangedSubscription {
    connected @client {
      ...ConnectionFragment
    }
  }

  ${CONNECTION_FRAGMENT}
`;

const connectionMutationResolver: LocalResolverFn<
  ConnectionMutationVariables
> = (_, variables, { cache, getCacheKey }) => {
  const id = getCacheKey({
    __typename: "ConnectionStatus",
    id: CONNECTION_STATUS_ID,
  });

  const data = cache.readFragment<ConnectionStatus>({
    fragment: CONNECTION_FRAGMENT,
    id,
  }) as ConnectionStatus;

  const connected = { ...data, ...variables };

  cache.writeData({
    id,
    data: connected,
  });

  return connected;
};

export const connectionResolvers = {
  Mutation: {
    connected: connectionMutationResolver,
  },

  Query: {},
};
