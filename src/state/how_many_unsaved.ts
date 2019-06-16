import { InMemoryCache } from "apollo-cache-inmemory";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryReturned
} from "../components/ExperienceDefinition/resolver-utils";
import {
  GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
  UnsavedEntriesQueryReturned
} from "../components/NewEntry/resolvers";

export async function howManyUnsaved(cache: InMemoryCache) {
  const unsavedExperiencesData = cache.readQuery<
    UnsavedExperiencesQueryReturned
  >({
    query: UNSAVED_EXPERIENCES_QUERY
  });

  const unsavedExperiences = unsavedExperiencesData
    ? unsavedExperiencesData.unsavedExperiences
    : [];

  const savedExperiencesUnsavedEntriesData = cache.readQuery<
    UnsavedEntriesQueryReturned
  >({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY
  });

  const savedExperiencesUnsavedEntries = savedExperiencesUnsavedEntriesData
    ? savedExperiencesUnsavedEntriesData.savedExperiencesUnsavedEntries
    : [];

  return savedExperiencesUnsavedEntries.length + unsavedExperiences.length;
}
