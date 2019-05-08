import { graphql } from "react-apollo";

import { NewExperience as Comp } from "./new-exp-x";
import { OwnProps } from "./new-exp";
import EXP_MUTATION, {
  CreateExpMutationProps,
  ExpMutationFn
} from "../../graphql/create-exp.mutation";
import {
  CreateExpMutation,
  CreateExpMutationVariables
} from "../../graphql/apollo-gql";

const expMutationGql = graphql<
  OwnProps,
  CreateExpMutation,
  CreateExpMutationVariables,
  CreateExpMutationProps | void
>(EXP_MUTATION, {
  props: props => {
    const mutate = props.mutate as ExpMutationFn;
    return {
      createExp: mutate
    };
  }
});

export const NewExperience = expMutationGql(Comp);
