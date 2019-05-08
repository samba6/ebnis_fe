import { graphql, compose, withApollo } from "react-apollo";

import { UserRegMutation } from "../../graphql/apollo-gql";
import { UserRegMutationVariables } from "../../graphql/apollo-gql";
import REG_USER_MUTATION, {
  RegFn,
  RegMutationProps
} from "../../graphql/user-reg.mutation";
import { userLocalMutationGql } from "../../state/user.local.mutation";
import {SignUp as Comp} from "./sign-up-x";

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

export const SignUp = compose(
  withApollo,
  userLocalMutationGql,
  regUserGql
)(Comp);
