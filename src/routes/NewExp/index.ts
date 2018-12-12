import { graphql } from "react-apollo";

import NewExp from "./new-exp-x";
import { OwnProps } from "./new-exp";
import EXP_MUTATION, {
  CreateExpMutationProps,
  ExpMutationFn
} from "../../graphql/create-exp.mutation";
import {
  CreateExpMutation,
  CreateExpMutationVariables
} from "../../graphql/apollo-gql.d";

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

export default expMutationGql(NewExp);
