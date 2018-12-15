import gql from "graphql-tag";
import { DataValue } from "react-apollo";

export const CONN_QUERY = gql`
  query ConnQuery {
    connected @client {
      isConnected
    }
  }
`;

export default CONN_QUERY;

export interface ConnData {
  connected?: { isConnected: boolean };
}

export type ConnProps = DataValue<ConnData>;
