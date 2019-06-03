import gql from "graphql-tag";
import { graphql } from "react-apollo";
import { ConnectionMutationData } from "./conn.mutation";

export const CONNECTION_QUERY = gql`
  query ConnQuery {
    connected @client {
      isConnected
      appNewlyLoaded
    }
  }
`;

export default CONNECTION_QUERY;

export interface ConnectionQueryData {
  connected?: ConnectionMutationData;
}

export const connectionGql = graphql<
  {},
  ConnectionQueryData,
  {},
  ConnectionMutationData | undefined
>(CONNECTION_QUERY, {
  props: ({ data }) => {
    if (!data) {
      return data;
    }

    return data.connected;
  }
});
