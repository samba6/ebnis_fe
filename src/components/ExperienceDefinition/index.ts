import { graphql, compose, withApollo } from "react-apollo";

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
import { createUnsavedExperienceGql } from "./local-queries";
import { resolvers } from "./resolvers";

let resolverAdded = false;

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
  },

  options: ({ client }) => {
    if (!resolverAdded) {
      client.addResolvers(resolvers);
    }

    resolverAdded = true;

    return {};
  }
});

export const ExperienceDefinition = compose(
  withApollo,
  expMutationGql,
  createUnsavedExperienceGql
)(Comp);
