import React from "react";
import { compose, graphql } from "react-apollo";
import { EditEntry as Comp } from "./edit-entry-component";
import { OwnProps, Props } from "./edit-entry-utils";
import {
  UpdateDefinitionsMutationProps,
  UPDATE_DEFINITIONS_ONLINE_MUTATION,
  UPDATE_DATA_OBJECTS_ONLINE_MUTATION,
  UpdateDataObjectsOnlineMutationProps,
  UPDATE_DEFINITION_AND_DATA_ONLINE_MUTATION,
  UpdateDefinitionAndDataOnlineMutationProps,
} from "../../graphql/update-definition-and-data.mutation";
import {
  UpdateDefinitions,
  UpdateDefinitionsVariables,
} from "../../graphql/apollo-types/UpdateDefinitions";
import { editEntryUpdate } from "./edit-entry.update";
import {
  UpdateDataObjectsVariables,
  UpdateDataObjects,
} from "../../graphql/apollo-types/UpdateDataObjects";
import {
  UpdateDefinitionAndDataVariables,
  UpdateDefinitionAndData,
} from "../../graphql/apollo-types/UpdateDefinitionAndData";

const updateDefinitonsOnlineGql = graphql<
  OwnProps,
  UpdateDefinitions,
  UpdateDefinitionsVariables,
  UpdateDefinitionsMutationProps | undefined
>(UPDATE_DEFINITIONS_ONLINE_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      updateDefinitionsOnline: mutate,
    },
});

const updateDataObjectsOnlineGql = graphql<
  OwnProps,
  UpdateDataObjects,
  UpdateDataObjectsVariables,
  UpdateDataObjectsOnlineMutationProps | undefined
>(UPDATE_DATA_OBJECTS_ONLINE_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      updateDataObjectsOnline: mutate,
    },
});

const updateDefinitionAndDataOnlineGql = graphql<
  OwnProps,
  UpdateDefinitionAndData,
  UpdateDefinitionAndDataVariables,
  UpdateDefinitionAndDataOnlineMutationProps | undefined
>(UPDATE_DEFINITION_AND_DATA_ONLINE_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      updateDefinitionAndDataOnline: mutate,
    },
});

export const EditEntry = compose(
  updateDefinitonsOnlineGql,
  updateDataObjectsOnlineGql,
  updateDefinitionAndDataOnlineGql,
)((props: Props) => <Comp editEntryUpdate={editEntryUpdate} {...props} />);
