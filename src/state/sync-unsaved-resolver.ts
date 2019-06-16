import { InMemoryCache } from "apollo-cache-inmemory";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryReturned
} from "../components/ExperienceDefinition/resolver-utils";
import {
  GET_UNSAVED_ENTRY_SAVED_EXPERIENCE_IDS_QUERY,
  UnsavedEntriesSavedExperiencesQueryReturned
} from "../components/NewEntry/resolvers";

export async function getUnsavedCount(cache: InMemoryCache) {
  return (
    getUnsavedEntriesSavedExperiences(cache).length +
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

function getUnsavedEntriesSavedExperiences(cache: InMemoryCache) {
  const unsavedEntriesSavedExperiencesData = cache.readQuery<
    UnsavedEntriesSavedExperiencesQueryReturned
  >({
    query: GET_UNSAVED_ENTRY_SAVED_EXPERIENCE_IDS_QUERY
  });

  const unsavedEntriesSavedExperiences = unsavedEntriesSavedExperiencesData
    ? unsavedEntriesSavedExperiencesData.unsavedEntriesSavedExperiences
    : [];

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n unsavedEntriesSavedExperiences\n",
    unsavedEntriesSavedExperiences,
    "\n\n\n\n\t\tLogging ends\n"
  );

  return unsavedEntriesSavedExperiences;
}
