import { useMutation } from "@apollo/react-hooks";
import {
  UPDATE_DEFINITIONS_ONLINE_MUTATION,
  UPDATE_DATA_OBJECTS_ONLINE_MUTATION,
  UPDATE_DEFINITION_AND_DATA_ONLINE_MUTATION,
} from "../../graphql/update-definition-and-data.mutation";
import {
  UpdateDefinitions,
  UpdateDefinitionsVariables,
} from "../../graphql/apollo-types/UpdateDefinitions";
import {
  UpdateDataObjectsVariables,
  UpdateDataObjects,
} from "../../graphql/apollo-types/UpdateDataObjects";
import {
  UpdateDefinitionAndDataVariables,
  UpdateDefinitionAndData,
} from "../../graphql/apollo-types/UpdateDefinitionAndData";

export function editEntryUpdate() {}

export function useUpdateDefinitionsOnline() {
  return useMutation<UpdateDefinitions, UpdateDefinitionsVariables>(
    UPDATE_DEFINITIONS_ONLINE_MUTATION,
  );
}

export function useUpdateDataObjectsOnline() {
  return useMutation<UpdateDataObjects, UpdateDataObjectsVariables>(
    UPDATE_DATA_OBJECTS_ONLINE_MUTATION,
  );
}

export function useUpdateDefinitionAndDataOnline() {
  return useMutation<UpdateDefinitionAndData, UpdateDefinitionAndDataVariables>(
    UPDATE_DEFINITION_AND_DATA_ONLINE_MUTATION,
  );
}
