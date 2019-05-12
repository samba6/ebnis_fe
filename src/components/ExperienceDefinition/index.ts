import { graphql } from "react-apollo";

import { ExperienceDefinition as Comp } from "./component";
import { OwnProps } from "./utils";
import {
  EXP_MUTATION,
  CreateExpMutationProps,
  CreateExpMutationFn
} from "../../graphql/create-exp.mutation";
import {
  CreateExpMutation,
  CreateExpMutationVariables
} from "../../graphql/apollo-types/CreateExpMutation";

const expMutationGql = graphql<
  OwnProps,
  CreateExpMutation,
  CreateExpMutationVariables,
  CreateExpMutationProps | void
>(EXP_MUTATION, {
  props: props => {
    const mutate = props.mutate as CreateExpMutationFn;
    return {
      createExp: mutate
    };
  }
});

export const ExperienceDefinition = expMutationGql(Comp);
