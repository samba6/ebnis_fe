import { InMemoryCache } from "apollo-cache-inmemory";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryReturned
} from "../components/ExperienceDefinition/resolver-utils";
import { graphql, DataValue } from "react-apollo";
import {
  GET_UNSAVED_ENTRIES_SAVED_EXPERIENCES_QUERY,
  UnsavedEntriesSavedExperiencesQueryReturned
} from "../components/NewEntry/resolver-utils";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node
} from "../graphql/apollo-types/ExperienceFragment";
import { isUnsavedId } from "../constants";
import gql from "graphql-tag";

export async function getUnsavedCount(cache: InMemoryCache) {
  return (
    getUnsavedEntriesSavedExperiences(cache).reduce((acc, experience) => {
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

function getUnsavedEntriesSavedExperiences(cache: InMemoryCache) {
  const unsavedEntriesSavedExperiencesData = cache.readQuery<
    UnsavedEntriesSavedExperiencesQueryReturned
  >({
    query: GET_UNSAVED_ENTRIES_SAVED_EXPERIENCES_QUERY
  });

  const unsavedEntriesSavedExperiences = unsavedEntriesSavedExperiencesData
    ? unsavedEntriesSavedExperiencesData.unsavedEntriesSavedExperiences
    : [];

  return unsavedEntriesSavedExperiences;
}

export type UnsavedEntriesSavedExperiencesData = DataValue<
  UnsavedEntriesSavedExperiencesQueryReturned
>;

export interface UnsavedEntriesSavedExperiencesProps {
  unSavedEntriesSavedExperiencesProps?: UnsavedEntriesSavedExperiencesData;
}

// istanbul ignore next:
export const unSavedEntriesSavedExperiencesGql = graphql<
  {},
  UnsavedEntriesSavedExperiencesQueryReturned,
  {},
  UnsavedEntriesSavedExperiencesProps | undefined
>(GET_UNSAVED_ENTRIES_SAVED_EXPERIENCES_QUERY, {
  props: ({ data }) =>
    data && {
      unSavedEntriesSavedExperiencesProps: data
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

export const UPLOAD_UNSAVED_MUTATION = gql`
  mutation UploadUnsavedMutation($input: UploadUnsavedInput!) {
    uploadUnsaved(input: $input)
  }
`;

export const DEFAULT_UNSAVED_STATES = {
  unsavedExperiences: [],
  unsavedEntriesSavedExperiences: []
};
