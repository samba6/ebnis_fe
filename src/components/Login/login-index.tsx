import React from "react";
import { graphql, compose } from "react-apollo";
import { Login as Comp } from "./login.component";
import { Props } from "./login.utils";
import {
  LoginMutation,
  LoginMutationVariables,
} from "../../graphql/apollo-types/LoginMutation";
import {
  LoginMutationProps,
  LOGIN_MUTATION,
} from "../../graphql/login.mutation";
import { scrollIntoView } from "../scroll-into-view";

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

export const Login = compose(loginGql)((props: Props) => (
  <Comp scrollToTop={scrollIntoView} {...props} />
));
