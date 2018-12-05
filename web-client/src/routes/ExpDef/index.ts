import { graphql } from "react-apollo";

import NewExp from "./exp-def-x";
import { OwnProps } from "./exp-def";
import EXPERIENCE_MUTATION, {
  ExpDefMutationProps,
  ExpDefMutationFn
} from "../../graphql/create-exp-def.mutation";
import {
  ExpDefMutation,
  ExpDefMutationVariables
} from "../../graphql/apollo-gql.d";

const expMutationGql = graphql<
  OwnProps,
  ExpDefMutation,
  ExpDefMutationVariables,
  ExpDefMutationProps | void
>(EXPERIENCE_MUTATION, {
  props: props => {
    const mutate = props.mutate as ExpDefMutationFn;
    return {
      createExperience: mutate
    };
  }
});

export default expMutationGql(NewExp);
