import { graphql, DataValue } from "react-apollo";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node,
} from "../graphql/apollo-types/ExperienceFragment";
import gql from "graphql-tag";
import { DataProxy } from "apollo-cache";
import { LocalResolverFn } from "./resolvers";
import { isUnsavedId } from "../constants";
import { readGetExperienceFullQueryFromCache } from "./resolvers/read-get-experience-full-query-from-cache";

const SAVED_AND_UNSAVED_EXPERIENCES_QUERY = gql`
  {
    savedAndUnsavedExperiences @client {
      id
      unsavedEntriesCount
    }
  }
`;

export function getUnsavedCount(dataProxy: DataProxy) {
  const data = dataProxy.readQuery<SavedAndUnsavedExperiencesQueryReturned>({
    query: SAVED_AND_UNSAVED_EXPERIENCES_QUERY,
  });

  return ((data && data.savedAndUnsavedExperiences) || []).reduce(
    (acc, { id, unsavedEntriesCount }) => {
      acc += unsavedEntriesCount;

      if (isUnsavedId(id)) {
        ++acc;
      }

      return acc;
    },
    0,
  );
}

export function entryNodesFromExperience({ entries }: ExperienceFragment) {
  return ((entries.edges as ExperienceFragment_entries_edges[]) || []).map(
    (edge: ExperienceFragment_entries_edges) => {
      return edge.node as ExperienceFragment_entries_edges_node;
    },
  );
}

type SavedAndUnsavedExperiencesTypeName = "SavedAndUnsavedExperiences";

const SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME = "SavedAndUnsavedExperiences" as SavedAndUnsavedExperiencesTypeName;

interface SavedAndUnsavedExperiences {
  id: string;
  unsavedEntriesCount: number;
  __typename: SavedAndUnsavedExperiencesTypeName;
}

interface SavedAndUnsavedExperiencesQueryReturned {
  savedAndUnsavedExperiences: SavedAndUnsavedExperiences[];
}

export function writeSavedAndUnsavedExperiences(
  dataProxy: DataProxy,
  id: string,
) {
  const data = dataProxy.readQuery<SavedAndUnsavedExperiencesQueryReturned>({
    query: SAVED_AND_UNSAVED_EXPERIENCES_QUERY,
  });

  let existsInCache = false;

  const cacheData = ((data && data.savedAndUnsavedExperiences) || []).reduce(
    (acc, map) => {
      if (map.id === id) {
        ++map.unsavedEntriesCount;
        existsInCache = true;
      }

      acc.push(map);

      return acc;
    },
    [] as SavedAndUnsavedExperiences[],
  );

  if (existsInCache === false) {
    cacheData.push({
      id: id,
      unsavedEntriesCount: isUnsavedId(id) ? 0 : 1,
      __typename: SAVED_AND_UNSAVED_EXPERIENCE_TYPENAME,
    });
  }

  dataProxy.writeQuery<SavedAndUnsavedExperiencesQueryReturned>({
    query: SAVED_AND_UNSAVED_EXPERIENCES_QUERY,

    data: {
      savedAndUnsavedExperiences: cacheData,
    },
  });
}

export const GET_ALL_UNSAVED_QUERY = gql`
  {
    getAllUnsaved @client
  }
`;

export interface GetAllUnSavedQueryReturned {
  getAllUnsaved: GetUnsavedSummary;
}

export type GetAllUnSavedQueryData = DataValue<GetAllUnSavedQueryReturned>;

export interface GetAllUnSavedQueryProps {
  getAllUnsavedProps: GetAllUnSavedQueryData;
}

export const getAllUnsavedGql = graphql<
  {},
  GetAllUnSavedQueryReturned,
  {},
  GetAllUnSavedQueryProps | undefined
>(GET_ALL_UNSAVED_QUERY, {
  props: ({ data }) =>
    data && {
      getAllUnsavedProps: data,
    },

  options: {
    fetchPolicy: "no-cache",
  },
});

const getAllUnsavedResolver: LocalResolverFn<{}, GetUnsavedSummary> = (
  root,
  variables,
  { cache },
) => {
  let unsavedExperiencesLen = 0;
  let savedExperiencesLen = 0;
  const unsavedExperiencesMap = {} as UnsavedExperienceSummaryMap;
  const savedExperiencesMap = {} as UnsavedExperienceSummaryMap;

  const data = cache.readQuery<SavedAndUnsavedExperiencesQueryReturned>({
    query: SAVED_AND_UNSAVED_EXPERIENCES_QUERY,
  });

  ((data && data.savedAndUnsavedExperiences) || []).forEach(({ id: id }) => {
    const experience = readGetExperienceFullQueryFromCache(cache, id);

    if (experience) {
      if (isUnsavedId(id)) {
        ++unsavedExperiencesLen;
        unsavedExperiencesMap[id] = {
          experience,
          savedEntries: [],
          unsavedEntries: entryNodesFromExperience(experience),
        };
      } else {
        ++savedExperiencesLen;

        savedExperiencesMap[id] = {
          experience,
          ...separateExperienceUnsavedEntries(experience),
        };
      }
    }
  });

  return {
    unsavedExperiencesMap,
    savedExperiencesMap,
    unsavedExperiencesLen,
    savedExperiencesLen,
  };
};

function separateExperienceUnsavedEntries({ entries }: ExperienceFragment) {
  let unsavedEntries: ExperienceFragment_entries_edges_node[] = [];
  let savedEntries: ExperienceFragment_entries_edges_node[] = [];

  ((entries.edges as ExperienceFragment_entries_edges[]) || []).forEach(
    (edge: ExperienceFragment_entries_edges) => {
      const node = edge.node as ExperienceFragment_entries_edges_node;

      if (isUnsavedId(node.id)) {
        unsavedEntries.push(node);
      } else {
        savedEntries.push(node);
      }
    },
  );

  return { unsavedEntries, savedEntries };
}

export const DEFAULT_UNSAVED_STATES = {
  savedAndUnsavedExperiences: [],
};

export const unsavedResolvers = {
  Mutation: {},

  Query: { getAllUnsaved: getAllUnsavedResolver },
};

export interface GetUnsavedSummary {
  unsavedExperiencesMap: UnsavedExperienceSummaryMap;

  savedExperiencesMap: UnsavedExperienceSummaryMap;

  unsavedExperiencesLen: number;

  savedExperiencesLen: number;
}

interface UnsavedExperienceSummaryMap {
  [K: string]: SavedAndUnsavedExperienceSummary;
}

export interface SavedAndUnsavedExperienceSummary {
  unsavedEntries: ExperienceFragment_entries_edges_node[];
  experience: ExperienceFragment;
  savedEntries: ExperienceFragment_entries_edges_node[];
}
