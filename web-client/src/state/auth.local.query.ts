import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { userFragment } from "../graphql/user.fragment";
import { UserFragment } from "../graphql/apollo-gql";

export const authUserLocalQuery = gql`
  query UserLocalQuery {
    user @client {
      ...UserFragment
    }

    staleToken @client
  }

  ${userFragment}
`;

export default authUserLocalQuery;

export interface UserLocalGqlData {
  user?: UserFragment;
  staleToken?: string | null;
}

export type UserLocalGqlProps = DataValue<UserLocalGqlData>;
