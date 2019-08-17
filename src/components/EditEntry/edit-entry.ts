import { compose, graphql } from "react-apollo";
import { EditEntry as Comp } from "./edit-entry-component";
import { OwnProps } from "./edit-entry-utils";
import {
  UpdateDefinitionsMutationProps,
  UPDATE_DEFINITIONS_MUTATION,
} from "../../graphql/update-definitions.mutation";
import {
  UpdateDefinitions,
  UpdateDefinitionsVariables,
} from "../../graphql/apollo-types/UpdateDefinitions";

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

export const EditEntry = compose(updateDefinitonsGql)(Comp);
