import { graphql, compose } from "react-apollo";

import { UserRegMutation } from "../../graphql/apollo-gql.d";
import { UserRegMutationVariables } from "../../graphql/apollo-gql.d";
import REG_USER_MUTATION, {
  RegFn,
  RegMutationProps
} from "../../graphql/user-reg.mutation";
import { userLocalMutationGql } from "./../../state/user.local.mutation";
import SignUp from "./sign-up-x";
import { CONN_QUERY, ConnProps, ConnData } from "../../state/conn.query";

const regUserGql = graphql<
  {},
  UserRegMutation,
  UserRegMutationVariables,
  RegMutationProps
>(REG_USER_MUTATION, {
  props: props => {
    const mutate = props.mutate as RegFn;

    return {
      regUser: mutate
    };
  }
});

const connGql = graphql<{}, ConnData, {}, ConnProps | undefined>(CONN_QUERY, {
  props: props => props.data
});

export default compose(
  connGql,
  userLocalMutationGql,
  regUserGql
)(SignUp);
