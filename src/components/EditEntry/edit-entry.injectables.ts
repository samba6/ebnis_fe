import { DataProxy } from "apollo-cache";
import { FetchResult } from "apollo-link";
import { useMutation } from "@apollo/react-hooks";
import {
  MutationFunction,
  MutationFunctionOptions,
  MutationResult,
} from "@apollo/react-common";
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
  UpdateDataObjects_updateDataObjects,
} from "../../graphql/apollo-types/UpdateDataObjects";
import {
  UpdateDefinitionAndDataVariables,
  UpdateDefinitionAndData,
} from "../../graphql/apollo-types/UpdateDefinitionAndData";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import immer from "immer";
import { upsertExperienceWithEntry } from "../NewEntry/new-entry.injectables";
import { CreateOnlineEntryMutation } from "../../graphql/apollo-types/CreateOnlineEntryMutation";

export function editEntryUpdate(entry: EntryFragment) {
  return async function(
    dataProxy: DataProxy,
    mutationResult: FetchResult<UpdateDataObjects>,
  ) {
    const updatedDataObjects =
      mutationResult.data && mutationResult.data.updateDataObjects;

    if (!updatedDataObjects) {
      return;
    }

    let hasUpdates = false;

    const idToUpdatedDataObjectMap = updatedDataObjects.reduce(
      (acc, updateResult) => {
        const {
          id,
          dataObject,
        } = updateResult as UpdateDataObjects_updateDataObjects;

        if (dataObject) {
          acc[id] = dataObject;
          hasUpdates = true;
        }

        return acc;
      },
      {} as { [k: string]: DataObjectFragment },
    );

    if (!hasUpdates) {
      return;
    }

    const updatedEntry = immer(entry, proxy => {
      proxy.dataObjects = proxy.dataObjects.map(d => {
        const dataObject = d as DataObjectFragment;
        return idToUpdatedDataObjectMap[dataObject.id] || dataObject;
      });
    });

    upsertExperienceWithEntry(entry.experienceId, "online")(dataProxy, {
      data: {
        createEntry: {
          entry: updatedEntry,
        },
      } as CreateOnlineEntryMutation,
    });
  };
}

export interface EditEntryUpdateProps {
  editEntryUpdateProp: typeof editEntryUpdate;
}

export type UpdateDataObjectsMutationFn = MutationFunction<
  UpdateDataObjects,
  UpdateDataObjectsVariables
>;

export type UpdateDefinitionsOnlineMutationFn = MutationFunction<
  UpdateDefinitions,
  UpdateDefinitionsVariables
>;

export type UpdateDefinitionsAndDataOnlineMutationFn = MutationFunction<
  UpdateDefinitionAndData,
  UpdateDefinitionAndDataVariables
>;

export type UseUpdateDataObjectsMutation = [
  UpdateDataObjectsMutationFn,
  MutationResult<UpdateDataObjects>,
];

export type UseUpdateDefinitionsOnlineMutation = [
  UpdateDefinitionsOnlineMutationFn,
  MutationResult<UpdateDefinitions>,
];

export type UseUpdateDefinitionsAndDataOnlineMutation = [
  UpdateDefinitionsAndDataOnlineMutationFn,
  MutationResult<UpdateDefinitionAndData>,
];

export function useUpdateDataObjectsOnlineMutation(): UseUpdateDataObjectsMutation {
  return useMutation(UPDATE_DATA_OBJECTS_ONLINE_MUTATION);
}

export function useUpdateDefinitionsOnline(): UseUpdateDefinitionsOnlineMutation {
  return useMutation(UPDATE_DEFINITIONS_ONLINE_MUTATION);
}

export function useUpdateDefinitionAndDataOnline(): UseUpdateDefinitionsAndDataOnlineMutation {
  return useMutation(UPDATE_DEFINITION_AND_DATA_ONLINE_MUTATION);
}

// used to type check test mock calls
export type UpdateDataObjectsMutationFnOptions = MutationFunctionOptions<
  UpdateDataObjects,
  UpdateDataObjectsVariables
>;

// component's props should extend this
export interface UpdateDataObjectsOnlineMutationComponentProps {
  updateDataObjectsOnline: UpdateDataObjectsMutationFn;
}

export interface UpdateDefinitionsOnlineMutationComponentProps {
  updateDefinitionsOnline: UpdateDefinitionsOnlineMutationFn;
}

export interface UpdateDefinitionsAndDataOnlineMutationComponentProps {
  updateDefinitionsAndDataOnline: UpdateDefinitionsAndDataOnlineMutationFn;
}
