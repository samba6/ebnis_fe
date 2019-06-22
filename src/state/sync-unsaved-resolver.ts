import { InMemoryCache } from "apollo-cache-inmemory";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryReturned
} from "../components/ExperienceDefinition/resolver-utils";
import { graphql, DataValue } from "react-apollo";
import {
  GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
  SavedExperiencesUnsavedEntriesQueryReturned
} from "../components/NewEntry/resolver-utils";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node
} from "../graphql/apollo-types/ExperienceFragment";
import { isUnsavedId } from "../constants";

export async function getUnsavedCount(cache: InMemoryCache) {
  return (
    getSavedExperiencesUnsavedEntries(cache).reduce((acc, experience) => {
      entryNodesFromExperience(experience).forEach(({ id }) => {
        if (isUnsavedId(id)) {
          ++acc;
        }
      });

      return acc;
    }, 0) + getUnsavedExperiences(cache).length
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
    SavedExperiencesUnsavedEntriesQueryReturned
  >({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY
  });

  const savedExperiencesUnsavedEntries = savedExperiencesUnsavedEntriesData
    ? savedExperiencesUnsavedEntriesData.savedExperiencesUnsavedEntries
    : [];

  return savedExperiencesUnsavedEntries;
}

export type SavedExperiencesUnsavedEntriesData = DataValue<
  SavedExperiencesUnsavedEntriesQueryReturned
>;

export interface SavedExperiencesUnsavedEntriesProps {
  savedExperiencesUnSavedEntriesProps?: SavedExperiencesUnsavedEntriesData;
}

// istanbul ignore next:
export const savedExperiencesUnSavedEntriesGql = graphql<
  {},
  SavedExperiencesUnsavedEntriesQueryReturned,
  {},
  SavedExperiencesUnsavedEntriesProps | undefined
>(GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY, {
  props: ({ data }) =>
    data && {
      savedExperiencesUnSavedEntriesProps: data
    }
});

export type UnsavedExperiencesData = DataValue<UnsavedExperiencesQueryReturned>;

export interface UnsavedExperiencesProps {
  unSavedExperiencesProps?: UnsavedExperiencesData;
}

// istanbul ignore next:
export const unSavedExperiencesGql = graphql<
  {},
  UnsavedExperiencesQueryReturned,
  {},
  UnsavedExperiencesProps | undefined
>(UNSAVED_EXPERIENCES_QUERY, {
  props: ({ data }) =>
    data && {
      unSavedExperiencesProps: data
    }
});

export function entryNodesFromExperience({ entries }: ExperienceFragment) {
  return ((entries.edges as ExperienceFragment_entries_edges[]) || []).map(
    (edge: ExperienceFragment_entries_edges) => {
      return edge.node as ExperienceFragment_entries_edges_node;
    }
  );
}

export const DEFAULT_UNSAVED_STATES = {
  unsavedExperiences: [],
  savedExperiencesUnsavedEntries: []
};
