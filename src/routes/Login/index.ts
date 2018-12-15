import { graphql, compose } from "react-apollo";

import Login from "./login-x";
import { userLocalMutationGql } from "../../state/user.local.mutation";
import USER_LOCAL_QUERY, {
  LoggedOutUserData,
  LoggedOutUserProps
} from "../../state/logged-out-user.local.query";
import {
  LoginMutation,
  LoginMutationVariables
} from "../../graphql/apollo-gql.d";
import LOGIN_MUTATION, {
  LoginMutationProps
} from "../../graphql/login.mutation";
import { CONN_QUERY, ConnProps, ConnData } from "../../state/conn.query";

const loggedOutUserGql = graphql<
  {},
  LoggedOutUserData,
  {},
  LoggedOutUserProps | undefined
>(USER_LOCAL_QUERY, {
  props: props => props.data
});

const loginGql = graphql<
  {},
  LoginMutation,
  LoginMutationVariables,
  LoginMutationProps
>(LOGIN_MUTATION, {
  props: props => {
    const mutate = props.mutate;

    return {
      login: mutate
    };
  }
});

const connGql = graphql<{}, ConnData, {}, ConnProps | undefined>(CONN_QUERY, {
  props: props => props.data
});

export default compose(
  connGql,
  loggedOutUserGql,
  userLocalMutationGql,
  loginGql
)(Login);
