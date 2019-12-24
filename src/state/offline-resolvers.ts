import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node,
} from "../graphql/apollo-types/ExperienceFragment";
import gql from "graphql-tag";
import { LocalResolverFn } from "./resolvers";
import { isOfflineId } from "../constants";
import { readGetExperienceFullQueryFromCache } from "./resolvers/read-get-experience-full-query-from-cache";
import { getExperiencesFromCache } from "./resolvers/get-experiences-from-cache";
import ApolloClient from "apollo-client";
import { QueryResult } from "@apollo/react-common";

export const ALL_EXPERIENCES_QUERY = gql`
  {
    allExperiences @client {
      id
      offlineEntriesCount
    }
  }
`;

export async function getOfflineItemsCount(client: ApolloClient<{}>) {
  return (await getExperiencesFromCache(client)).reduce(
    (acc, { id, offlineEntriesCount }) => {
      acc += offlineEntriesCount;

      if (isOfflineId(id)) {
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

type AllExperiencesTypeName = "AllExperiences";

export const ALL_EXPERIENCES_TYPENAME = "AllExperiences" as AllExperiencesTypeName;

export interface AllExperiences {
  id: string;
  offlineEntriesCount: number;
  __typename: AllExperiencesTypeName;
}

export interface AllExperiencesQueryReturned {
  allExperiences: AllExperiences[];
}

export const GET_OFFLINE_ITEMS_QUERY = gql`
  {
    getOfflineItems @client
  }
`;

export interface GetOfflineItemsQueryReturned {
  getOfflineItems: GetOfflineItemsSummary;
}

export type GetOfflineItemsQueryResult = QueryResult<
  GetOfflineItemsQueryReturned
>;

const getOfflineItemsResolver: LocalResolverFn<
  {},
  Promise<GetOfflineItemsSummary>
> = async (_root, _variables, { cache, client }) => {
  let neverSavedCount = 0;
  let partlySavedCount = 0;
  const neverSavedMap = {} as OfflineExperienceSummaryMap;
  const partlySavedMap = {} as OfflineExperienceSummaryMap;

  (await getExperiencesFromCache(client)).forEach(({ id: id }) => {
    const experience = readGetExperienceFullQueryFromCache(cache, id);

    if (experience) {
      if (isOfflineId(id)) {
        ++neverSavedCount;
        neverSavedMap[id] = {
          experience,
          onlineEntries: [],
          offlineEntries: entryNodesFromExperience(experience),
        };
      } else {
        ++partlySavedCount;

        partlySavedMap[id] = {
          experience,
          ...getOnlineAndOfflineEntriesFromExperience(experience),
        };
      }
    }
  });

  return {
    neverSavedMap,
    partlySavedMap,
    neverSavedCount,
    partlySavedCount,
  };
};

function getOnlineAndOfflineEntriesFromExperience({
  entries,
}: ExperienceFragment) {
  let offlineEntries: ExperienceFragment_entries_edges_node[] = [];
  let onlineEntries: ExperienceFragment_entries_edges_node[] = [];

  ((entries.edges as ExperienceFragment_entries_edges[]) || []).forEach(
    (edge: ExperienceFragment_entries_edges) => {
      const node = edge.node as ExperienceFragment_entries_edges_node;

      if (isOfflineId(node.id)) {
        offlineEntries.push(node);
      } else {
        onlineEntries.push(node);
      }
    },
  );

  return { offlineEntries, onlineEntries };
}

export const DEFAULT_OFFLINE_STATES = {
  allExperiences: [],
};

export const offlineItemsResolvers = {
  Mutation: {},

  Query: { getOfflineItems: getOfflineItemsResolver },
};

export interface GetOfflineItemsSummary {
  neverSavedMap: OfflineExperienceSummaryMap;
  partlySavedMap: OfflineExperienceSummaryMap;
  neverSavedCount: number;
  partlySavedCount: number;
}

interface OfflineExperienceSummaryMap {
  [K: string]: SavedAndUnsavedExperienceSummary;
}

export interface SavedAndUnsavedExperienceSummary {
  offlineEntries: ExperienceFragment_entries_edges_node[];
  experience: ExperienceFragment;
  onlineEntries: ExperienceFragment_entries_edges_node[];
}
