import gql from "graphql-tag";

export const connMutation = gql`
  mutation ConnMutation($isConnected: ConnInput!) {
    connected(isConnected: $isConnected) @client {
      isConnected
    }
  }
`;

export default connMutation;

export interface ConnectionMutationData {
  isConnected: boolean;
  appNewlyLoaded: boolean;
}

export interface ConnectionMutationVariables {
  isConnected: boolean;
}
