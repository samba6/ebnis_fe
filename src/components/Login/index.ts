import { graphql, compose, withApollo } from "react-apollo";

import { Login as Comp } from "./component";
import {
  LoginMutation,
  LoginMutationVariables,
} from "../../graphql/apollo-types/LoginMutation";
import {
  LoginMutationProps,
  LOGIN_MUTATION,
} from "../../graphql/login.mutation";
import { userLocalMutationGql, userLocalGql } from "../../state/user.resolver";
import { withUserHOC } from "../with-user-hoc";

const loginGql = graphql<
  {},
  LoginMutation,
  LoginMutationVariables,
  LoginMutationProps
>(LOGIN_MUTATION, {
  props: props => {
    const mutate = props.mutate;

    return {
      login: mutate,
    };
  },
});

export const Login = compose(
  withUserHOC,
  userLocalGql,
  withApollo,
  userLocalGql,
  userLocalMutationGql,
  loginGql,
)(Comp);
