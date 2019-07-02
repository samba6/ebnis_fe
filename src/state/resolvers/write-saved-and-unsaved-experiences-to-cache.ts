import { DataProxy } from "apollo-cache";
import {
  SavedAndUnsavedExperiencesQueryReturned,
  SAVED_AND_UNSAVED_EXPERIENCES_QUERY,
  SavedAndUnsavedExperiences,
} from "../unsaved-resolvers";

export function writeSavedAndUnsavedExperiencesToCache(
  dataProxy: DataProxy,
  data: SavedAndUnsavedExperiences[],
) {
  dataProxy.writeQuery<SavedAndUnsavedExperiencesQueryReturned>({
    query: SAVED_AND_UNSAVED_EXPERIENCES_QUERY,

    data: {
      savedAndUnsavedExperiences: data,
    },
  });
}
