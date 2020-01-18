import { DataProxy } from "apollo-cache";
import { FetchResult } from "apollo-link";
import {
  UpdateDataObjects,
  UpdateDataObjects_updateDataObjects,
} from "../../graphql/apollo-types/UpdateDataObjects";
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
