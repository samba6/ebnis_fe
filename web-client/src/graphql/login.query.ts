import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import userFragment from "./user.fragment";
import { LoginQuery, LoginQueryVariables } from "./apollo-gql";

export const loginQuery = gql`
  query LoginQuery($login: LoginUser!) {
    login(login: $login) {
      ...UserFragment
    }
  }
  ${userFragment}
`;

export default loginQuery;

export type LoginQueryProps = DataValue<LoginQuery, LoginQueryVariables>;
