import { graphql } from "react-apollo";
import React from "react";

import { NewExperience as Comp } from "./new-exp-x";
import { OwnProps, Props } from "./new-exp";
import {
  EXP_MUTATION,
  CreateExpMutationProps,
  ExpMutationFn
} from "../../graphql/create-exp.mutation";
import {
  CreateExpMutation,
  CreateExpMutationVariables
} from "../../graphql/apollo-types/CreateExpMutation";
import { SidebarHeader } from "../SidebarHeader";

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

function NewExperienceComp(
  props: Pick<Props, Exclude<keyof Props, "SidebarHeader">>
) {
  return <Comp {...props} SidebarHeader={SidebarHeader} />;
}

export const NewExperience = expMutationGql(NewExperienceComp);
