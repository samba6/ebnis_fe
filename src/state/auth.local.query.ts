import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { userFragment } from "../graphql/user.fragment";
import { UserFragment } from "../graphql/apollo-types/UserFragment";

export const USER_LOCAL_QUERY = gql`
  query UserLocalQuery {
    user @client {
      ...UserFragment
    }

    staleToken @client
  }

  ${userFragment}
`;

export default USER_LOCAL_QUERY;

export interface UserLocalGqlData {
  user?: UserFragment;
  staleToken?: string | null;
}

export type UserLocalGqlProps = DataValue<UserLocalGqlData>;
