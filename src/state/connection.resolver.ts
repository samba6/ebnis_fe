import { LocalResolverFn } from "./resolvers";
import gql from "graphql-tag";
import { graphql } from "react-apollo";
import { emitData, EmitAction } from "../setup-observable";

const CONNECTION_STATUS_ID = "connection-status";

export const DEFAULT_CONNECTION_STATUS: ConnectionStatus = {
  id: CONNECTION_STATUS_ID,
  __typename: "ConnectionStatus" as "ConnectionStatus",
  isConnected: false
};

export interface ConnectionStatus {
  id: string;
  __typename: "ConnectionStatus";
  isConnected: boolean;
}

export interface ConnectionQueryData {
  connected: ConnectionStatus;
}

const CONNECTION_FRAGMENT = gql`
  fragment ConnectionFragment on ConnectionStatus {
    id
    isConnected
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
    id: CONNECTION_STATUS_ID
  });

  const data = cache.readFragment<ConnectionStatus>({
    fragment: CONNECTION_FRAGMENT,
    id
  }) as ConnectionStatus;

  const connected = { ...data, ...variables };

  cache.writeData({
    id,
    data: connected
  });

  emitData({
    type: EmitAction.connectionChanged,
    data: variables.isConnected
  });

  return connected;
};

const connectionQueryResolver: LocalResolverFn<ConnectionMutationVariables> = (
  _,
  variables,
  { cache, getCacheKey }
) => {
  const id = getCacheKey({
    __typename: "ConnectionStatus",
    id: CONNECTION_STATUS_ID
  });

  const data = cache.readFragment<ConnectionStatus>({
    fragment: CONNECTION_FRAGMENT,
    id
  }) as ConnectionStatus;

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n data from query resolver\n",
    data,
    "\n\n\n\n\t\tLogging ends\n"
  );

  return data;
};

export const connectionResolvers = {
  Mutation: {
    connected: connectionMutationResolver
  },

  Query: {
    connected: connectionQueryResolver
  }
};
