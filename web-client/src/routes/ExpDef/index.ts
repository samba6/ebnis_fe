import { graphql } from "react-apollo";

import NewExp from "./exp-def-x";
import { OwnProps } from "./exp-def";
import EXPERIENCE_MUTATION, {
  ExperienceMutationProps,
  ExperienceMutationFn
} from "../../graphql/create-exp.mutation";
import {
  ExperienceMutation,
  ExperienceMutationVariables
} from "../../graphql/apollo-gql.d";

const expMutationGql = graphql<
  OwnProps,
  ExperienceMutation,
  ExperienceMutationVariables,
  ExperienceMutationProps | void
>(EXPERIENCE_MUTATION, {
  props: props => {
    const mutate = props.mutate as ExperienceMutationFn;
    return {
      createExperience: mutate
    };
  }
});

export default expMutationGql(NewExp);
