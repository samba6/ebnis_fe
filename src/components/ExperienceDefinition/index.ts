import { graphql, compose, withApollo } from "react-apollo";

import { ExperienceDefinition as Comp } from "./component";
import { OwnProps } from "./utils";
import {
  CREATE_EXPERIENCE_MUTATION,
  CreateExperienceMutationProps,
  CreateExperienceMutationFn
} from "../../graphql/create-experience.mutation";
import {
  CreateExperienceMutation,
  CreateExperienceMutationVariables
} from "../../graphql/apollo-types/CreateExperienceMutation";
import {
  experienceDefinitionResolvers,
  createUnsavedExperienceGql
} from "./resolvers";

let resolverAdded = false;

const expMutationGql = graphql<
  OwnProps,
  CreateExperienceMutation,
  CreateExperienceMutationVariables,
  CreateExperienceMutationProps | void
>(CREATE_EXPERIENCE_MUTATION, {
  props: props => {
    const mutate = props.mutate as CreateExperienceMutationFn;
    return {
      createExp: mutate
    };
  },

  options: ({ client }) => {
    if (!resolverAdded) {
      client.addResolvers(experienceDefinitionResolvers);
      resolverAdded = true;
    }

    return {};
  }
});

export const ExperienceDefinition = compose(
  withApollo,
  expMutationGql,
  createUnsavedExperienceGql
)(Comp);

export default ExperienceDefinition;
