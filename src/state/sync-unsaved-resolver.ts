import { InMemoryCache } from "apollo-cache-inmemory";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryReturned
} from "../components/ExperienceDefinition/resolver-utils";
import {
  GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
  UnsavedEntriesQueryReturned
} from "../components/NewEntry/resolvers";

export async function getUnsavedCount(cache: InMemoryCache) {
  return (
    getSavedExperiencesUnsavedEntries(cache).length +
    getUnsavedExperiences(cache).length
  );
}

function getUnsavedExperiences(cache: InMemoryCache) {
  const unsavedExperiencesData = cache.readQuery<
    UnsavedExperiencesQueryReturned
  >({
    query: UNSAVED_EXPERIENCES_QUERY
  });

  return unsavedExperiencesData
    ? unsavedExperiencesData.unsavedExperiences
    : [];
}

function getSavedExperiencesUnsavedEntries(cache: InMemoryCache) {
  const savedExperiencesUnsavedEntriesData = cache.readQuery<
    UnsavedEntriesQueryReturned
  >({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY
  });

  return savedExperiencesUnsavedEntriesData
    ? savedExperiencesUnsavedEntriesData.savedExperiencesUnsavedEntries
    : [];
}
