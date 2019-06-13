import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryReturned
} from "../ExperienceDefinition/resolver-utils";
import {
  GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
  UnsavedEntriesQueryReturned
} from "../NewEntry/resolvers";

export async function uploadUnsaved(
  cache: InMemoryCache,
  client: ApolloClient<{}>
) {
  const unsavedExperiencesData = cache.readQuery<
    UnsavedExperiencesQueryReturned
  >({
    query: UNSAVED_EXPERIENCES_QUERY
  });

  const unsavedExperiences = unsavedExperiencesData
    ? unsavedExperiencesData.unsavedExperiences
    : [];

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n unsavedExperiences\n",
    unsavedExperiences,
    "\n\n\n\n\t\tLogging ends\n"
  );

  const savedExperiencesUnsavedEntriesData = cache.readQuery<
    UnsavedEntriesQueryReturned
  >({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY
  });

  const savedExperiencesUnsavedEntries = savedExperiencesUnsavedEntriesData
    ? savedExperiencesUnsavedEntriesData.savedExperiencesUnsavedEntries
    : [];

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n savedExperiencesUnsavedEntries\n",
    savedExperiencesUnsavedEntries,
    "\n\n\n\n\t\tLogging ends\n"
  );
}
