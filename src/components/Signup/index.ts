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
import { SignUp as Comp } from "./component";

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

export const SignUp = compose(regUserGql)(Comp);
