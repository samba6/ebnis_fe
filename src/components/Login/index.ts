import { graphql, compose } from "react-apollo";

import { Login as Comp } from "./component";
import {
  LoginMutation,
  LoginMutationVariables,
} from "../../graphql/apollo-types/LoginMutation";
import {
  LoginMutationProps,
  LOGIN_MUTATION,
} from "../../graphql/login.mutation";

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

export const Login = compose(loginGql)(Comp);
