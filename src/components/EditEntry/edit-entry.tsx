import React from "react";
import { compose, graphql } from "react-apollo";
import { EditEntry as Comp } from "./edit-entry-component";
import { OwnProps, Props } from "./edit-entry-utils";
import {
  UpdateDefinitionsMutationProps,
  UPDATE_DEFINITIONS_MUTATION,
} from "../../graphql/update-definitions.mutation";
import {
  UpdateDefinitions,
  UpdateDefinitionsVariables,
} from "../../graphql/apollo-types/UpdateDefinitions";
import { editEntryUpdate } from "./edit-entry.update";

const updateDefinitonsGql = graphql<
  OwnProps,
  UpdateDefinitions,
  UpdateDefinitionsVariables,
  UpdateDefinitionsMutationProps | undefined
>(UPDATE_DEFINITIONS_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      updateDefinitionsOnline: mutate,
    },
});

export const EditEntry = compose(updateDefinitonsGql)((props: Props) => (
  <Comp editEntryUpdate={editEntryUpdate} {...props} />
));
