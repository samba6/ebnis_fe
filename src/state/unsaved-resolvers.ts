import { InMemoryCache } from "apollo-cache-inmemory";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryReturned
} from "../components/ExperienceDefinition/resolver-utils";
import { graphql, DataValue } from "react-apollo";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node
} from "../graphql/apollo-types/ExperienceFragment";
import { isUnsavedId } from "../constants";
import {
  getUnsavedExperiencesFromCache,
  getSavedExperiencesWithUnsavedEntriesFromCache
} from "./resolvers-utils";
import { EXPERIENCE_FRAGMENT } from "../graphql/experience.fragment";
import gql from "graphql-tag";

export const GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY = gql`
  query {
    savedExperiencesWithUnsavedEntries @client {
      ...ExperienceFragment
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export interface SavedExperiencesWithUnsavedEntriesQueryReturned {
  savedExperiencesWithUnsavedEntries: ExperienceFragment[];
}

export async function getUnsavedCount(cache: InMemoryCache) {
  const unsavedEntriesFromSavedExperiencesCount = getSavedExperiencesWithUnsavedEntriesFromCache(
    cache
  ).reduce((acc, experience) => {
    entryNodesFromExperience(experience).forEach(({ id }) => {
      if (isUnsavedId(id)) {
        ++acc;
      }
    });

    return acc;
  }, 0);

  return (
    unsavedEntriesFromSavedExperiencesCount +
    getUnsavedExperiencesFromCache(cache).length
  );
}

export type SavedExperiencesWithUnsavedEntriesData = DataValue<
  SavedExperiencesWithUnsavedEntriesQueryReturned
>;

export interface SavedExperiencesWithUnsavedEntriesProps {
  savedExperiencesWithUnsavedEntriesProps?: SavedExperiencesWithUnsavedEntriesData;
}

// istanbul ignore next:
export const savedExperiencesWithUnSavedEntriesGql = graphql<
  {},
  SavedExperiencesWithUnsavedEntriesQueryReturned,
  {},
  SavedExperiencesWithUnsavedEntriesProps | undefined
>(GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY, {
  props: ({ data }) =>
    data && {
      savedExperiencesWithUnsavedEntriesProps: data
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
  savedExperiencesWithUnsavedEntries: []
};
