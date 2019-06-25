import { DataProxy } from "apollo-cache";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import {
  UnsavedExperiencesQueryReturned,
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperience
} from "../components/ExperienceDefinition/resolver-utils";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
  SavedExperiencesWithUnsavedEntriesQueryReturned,
  GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY
} from "./unsaved-resolvers";

export function writeSavedExperiencesWithUnsavedEntriesToCache(
  cache: DataProxy,
  savedExperiencesWithUnsavedEntries: ExperienceFragment[]
) {
  cache.writeQuery<SavedExperiencesWithUnsavedEntriesQueryReturned>({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
    data: { savedExperiencesWithUnsavedEntries }
  });
}

export function writeUnsavedExperiencesToCache(
  cache: InMemoryCache | DataProxy,
  unsavedExperiences: UnsavedExperience[]
) {
  cache.writeQuery<UnsavedExperiencesQueryReturned>({
    query: UNSAVED_EXPERIENCES_QUERY,
    data: { unsavedExperiences }
  });
}

export function getUnsavedExperiencesFromCache(
  cache: InMemoryCache | DataProxy
) {
  const unsavedExperiencesData = cache.readQuery<
    UnsavedExperiencesQueryReturned
  >({
    query: UNSAVED_EXPERIENCES_QUERY
  });

  return unsavedExperiencesData
    ? unsavedExperiencesData.unsavedExperiences
    : [];
}

export function getSavedExperiencesWithUnsavedEntriesFromCache(
  cache: InMemoryCache | DataProxy
) {
  const savedExperiencesWithUnsavedEntriesData = cache.readQuery<
    SavedExperiencesWithUnsavedEntriesQueryReturned
  >({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY
  });

  const savedExperiencesWithUnsavedEntries = savedExperiencesWithUnsavedEntriesData
    ? savedExperiencesWithUnsavedEntriesData.savedExperiencesWithUnsavedEntries
    : [];

  return savedExperiencesWithUnsavedEntries;
}
