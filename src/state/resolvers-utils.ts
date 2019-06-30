import { DataProxy } from "apollo-cache";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import {
  UnsavedExperiencesQueryReturned,
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperience,
} from "../components/ExperienceDefinition/resolver-utils";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
  SavedExperiencesWithUnsavedEntriesQueryReturned,
  GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
} from "./unsaved-resolvers";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../graphql/apollo-types/GetExperienceConnectionMini";
import { GET_EXPERIENCES_MINI_QUERY } from "../graphql/get-experience-connection-mini.query";
import immer from "immer";
import { ExperienceConnectionFragment } from "../graphql/apollo-types/ExperienceConnectionFragment";

export function writeSavedExperiencesWithUnsavedEntriesToCache(
  cache: DataProxy,
  savedExperiencesWithUnsavedEntries: ExperienceFragment[],
) {
  cache.writeQuery<SavedExperiencesWithUnsavedEntriesQueryReturned>({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
    data: { savedExperiencesWithUnsavedEntries },
  });
}

export function writeUnsavedExperiencesToCache(
  cache: InMemoryCache | DataProxy,
  unsavedExperiences: UnsavedExperience[],
) {
  cache.writeQuery<UnsavedExperiencesQueryReturned>({
    query: UNSAVED_EXPERIENCES_QUERY,
    data: { unsavedExperiences },
  });
}

export function getUnsavedExperiencesFromCache(
  cache: InMemoryCache | DataProxy,
) {
  const unsavedExperiencesData = cache.readQuery<
    UnsavedExperiencesQueryReturned
  >({
    query: UNSAVED_EXPERIENCES_QUERY,
  });

  return unsavedExperiencesData
    ? unsavedExperiencesData.unsavedExperiences
    : [];
}

export function getSavedExperiencesWithUnsavedEntriesFromCache(
  cache: InMemoryCache | DataProxy,
) {
  const savedExperiencesWithUnsavedEntriesData = cache.readQuery<
    SavedExperiencesWithUnsavedEntriesQueryReturned
  >({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
  });

  const savedExperiencesWithUnsavedEntries = savedExperiencesWithUnsavedEntriesData
    ? savedExperiencesWithUnsavedEntriesData.savedExperiencesWithUnsavedEntries
    : [];

  return savedExperiencesWithUnsavedEntries;
}

// in case we are updating with unsaved experiences now saved and we did not
// previously have GET_EXPERIENCES query
const DEFAULT_EXPERIENCE_CONNECTION: ExperienceConnectionFragment = {
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    __typename: "PageInfo",
  },

  edges: [],

  __typename: "ExperienceConnection",
};

export function updateGetExperiencesQuery(
  dataProxy: DataProxy,
  experiences: ExperienceFragment[],
) {
  const variables: GetExperienceConnectionMiniVariables = {
    input: {
      pagination: {
        first: 20,
      },
    },
  };

  const experiencesMiniQuery = dataProxy.readQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    query: GET_EXPERIENCES_MINI_QUERY,
    variables,
  });

  const getExperiences =
    (experiencesMiniQuery && experiencesMiniQuery.getExperiences) ||
    DEFAULT_EXPERIENCE_CONNECTION;

  const updatedExperienceConnection = immer(getExperiences, proxy => {
    const edges = (getExperiences.edges || []).concat(
      experiences.map(e => ({
        node: e,
        cursor: "",
        __typename: "ExperienceEdge",
      })),
    );

    proxy.edges = edges;
  });

  dataProxy.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    query: GET_EXPERIENCES_MINI_QUERY,
    variables,
    data: { getExperiences: updatedExperienceConnection },
  });
}

export function removeAllReferencesToEntityFromCache(
  dataProxy: DataProxy,
  entitiesToRemove: RemoveReferencesToEntityFromCache,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cache = dataProxy as any;
  const dataClass = cache.data;
  const data = dataClass.data;
  let count = 0;
  const ids: string[] = [];

  entitiesToRemove.forEach(({ id, typename }) => {
    const cacheKey = typename ? `${typename}:${id}` : id;
    const cacheKeyRegex = new RegExp(cacheKey);
    const idRegex = new RegExp(id);
    ids.push(id);

    Object.keys(data).forEach(k => {
      if (cacheKeyRegex.test(k)) {
        delete data[k];
        ++count;
        return;
      }

      if (k === "ROOT_QUERY") {
        const rootQuery = data.ROOT_QUERY;

        Object.keys(rootQuery).forEach(rk => {
          if (idRegex.test(rk)) {
            const value = rootQuery[rk];

            if (value && value.id && value.id === cacheKey) {
              ++count;
              delete rootQuery[rk];
            }
          }
        });

        return;
      }

      if (k.startsWith("ROOT_MUTATION")) {
        if (idRegex.test(k)) {
          delete data[k];
          ++count;
          return;
        }

        const rootMutation = data.ROOT_MUTATION;

        Object.keys(rootMutation).forEach(rk => {
          if (idRegex.test(rk)) {
            ++count;
            delete rootMutation[rk];
          }
        });

        return;
      }
    });
  });

  ids.forEach(id => dataClass.delete(id));

  cache.broadcastWatches();

  return count;
}

export type RemoveReferencesToEntityFromCache = {
  id: string;
  typename?: string;
}[];
