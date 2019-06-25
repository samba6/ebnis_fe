import { DataProxy } from "apollo-cache";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import {
  UnsavedExperiencesQueryReturned,
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperience
} from "../components/ExperienceDefinition/resolver-utils";
import { InMemoryCache, NormalizedCache } from "apollo-cache-inmemory";
import {
  SavedExperiencesWithUnsavedEntriesQueryReturned,
  GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY
} from "./unsaved-resolvers";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables
} from "../graphql/apollo-types/GetExperienceConnectionMini";
import { GET_EXPERIENCES_MINI_QUERY } from "../graphql/get-experience-connection-mini.query";
import immer from "immer";

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

export function updateGetExperiencesQuery(
  dataProxy: DataProxy,
  experiences: ExperienceFragment[]
) {
  const variables: GetExperienceConnectionMiniVariables = {
    input: {
      pagination: {
        first: 20
      }
    }
  };

  const experiencesMiniQuery = dataProxy.readQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    query: GET_EXPERIENCES_MINI_QUERY,
    variables
  });

  const getExperiences = (experiencesMiniQuery &&
    experiencesMiniQuery.getExperiences) || {
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      __typename: "PageInfo"
    },

    edges: [],

    __typename: "ExperienceConnection"
  };

  const updatedExperienceConnection = immer(getExperiences, proxy => {
    const edges = (getExperiences.edges || []).concat(
      experiences.map(e => ({
        node: e,
        cursor: "",
        __typename: "ExperienceEdge"
      }))
    );

    proxy.edges = edges;
  });

  dataProxy.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    query: GET_EXPERIENCES_MINI_QUERY,
    variables,
    data: { getExperiences: updatedExperienceConnection }
  });
}

export function deleteEntity(cache: DataProxy, entry: string) {
  // tslint:disable-next-line: no-any
  const dataClass = (cache as any).data as NormalizedCache;

  // tslint:disable-next-line: no-any
  (cache as any).broadcastWatches();

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n dataClass\n",
    dataClass,
    "\n\n\n\n\t\tLogging ends\n"
  );
}
