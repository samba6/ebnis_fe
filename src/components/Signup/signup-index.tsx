import React from "react";
import { graphql, compose } from "react-apollo";
import {
  UserRegMutation,
  UserRegMutationVariables,
} from "../../graphql/apollo-types/UserRegMutation";
import {
  REG_USER_MUTATION,
  UserRegMutationFn,
  RegMutationProps,
} from "../../graphql/user-reg.mutation";
import { SignUp as Comp } from "./signup.component";
import { Props } from "./signup.utils";
import { scrollIntoView } from "../scroll-into-view";

const regUserGql = graphql<
  {},
  UserRegMutation,
  UserRegMutationVariables,
  RegMutationProps
>(REG_USER_MUTATION, {
  props: props => {
    const mutate = props.mutate as UserRegMutationFn;

    return {
      regUser: mutate,
    };
  },
});

export const SignUp = compose(regUserGql)((props: Props) => (
  <Comp {...props} scrollToTop={scrollIntoView} />
));
