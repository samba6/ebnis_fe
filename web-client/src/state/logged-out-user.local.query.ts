import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { userFragment } from "../graphql/user.fragment";
import { UserFragment } from "../graphql/apollo-gql";

export const loggedOutUserLocalQuery = gql`
  query LoggedOutUserLocalQuery {
    loggedOutUser @client {
      ...UserFragment
    }
  }

  ${userFragment}
`;

export default loggedOutUserLocalQuery;

export interface LoggedOutUserData {
  loggedOutUser: UserFragment;
}

export type LoggedOutUserProps = DataValue<LoggedOutUserData>;
