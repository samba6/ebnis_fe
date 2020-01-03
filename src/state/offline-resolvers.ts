import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node,
} from "../graphql/apollo-types/ExperienceFragment";
import gql from "graphql-tag";
import { LocalResolverFn } from "./resolvers";
import { isOfflineId } from "../constants";
import { readGetExperienceFullQueryFromCache } from "./resolvers/read-get-experience-full-query-from-cache";
import { queryCacheOfflineItems } from "./resolvers/get-experiences-from-cache";
import { QueryResult } from "@apollo/react-common";
import { InMemoryCache } from "apollo-cache-inmemory";

export const OFFLINE_ITEMS_QUERY = gql`
  {
    offlineItems @client {
      id
      offlineEntriesCount
    }
  }
`;

export function getOfflineItemsCount(cache: InMemoryCache) {
  return queryCacheOfflineItems(cache).reduce(
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

type OfflineItemsTypeName = "OfflineItems";

export const OFFLINE_ITEMS_TYPENAME = "OfflineItems" as OfflineItemsTypeName;

export interface OfflineItem {
  id: string;
  offlineEntriesCount: number;
  __typename: OfflineItemsTypeName;
}

export interface OfflineItemsQueryReturned {
  offlineItems: OfflineItem[];
}

export const GET_OFFLINE_ITEMS_QUERY = gql`
  {
    getOfflineItems @client
  }
`;

export interface GetOfflineItemsQueryReturned {
  getOfflineItems: GetOfflineItemsSummary;
}

export const QUERY_NAME_getOfflineItems = "getOfflineItems";

export type GetOfflineItemsQueryResult = QueryResult<
  GetOfflineItemsQueryReturned
>;

const getOfflineItemsResolver: LocalResolverFn<{}, GetOfflineItemsSummary> = (
  _root,
  _variables,
  { cache },
) => {
  let completelyOfflineCount = 0;
  let partialOnlineCount = 0;

  const completelyOfflineMap = {} as OfflineExperienceSummaryMap;
  const partialOnlineMap = {} as OfflineExperienceSummaryMap;

  queryCacheOfflineItems(cache).forEach(({ id: id }) => {
    const experience = readGetExperienceFullQueryFromCache(cache, id);

    if (experience) {
      if (isOfflineId(id)) {
        ++completelyOfflineCount;
        completelyOfflineMap[id] = {
          experience,
          onlineEntries: [],
          offlineEntries: entryNodesFromExperience(experience),
        };
      } else {
        ++partialOnlineCount;

        partialOnlineMap[id] = {
          experience,
          ...getOnlineAndOfflineEntriesFromExperience(experience),
        };
      }
    }
  });

  return {
    completelyOfflineMap,
    partialOnlineMap,
    completelyOfflineCount,
    partlyOfflineCount: partialOnlineCount,
  };
};

function getOnlineAndOfflineEntriesFromExperience({
  entries,
}: ExperienceFragment) {
  const offlineEntries: ExperienceFragment_entries_edges_node[] = [];
  const onlineEntries: ExperienceFragment_entries_edges_node[] = [];

  ((entries.edges as ExperienceFragment_entries_edges[]) || []).forEach(
    (edge: ExperienceFragment_entries_edges) => {
      const node = edge.node as ExperienceFragment_entries_edges_node;

      if (isOfflineId(node.id) || node.modOffline) {
        offlineEntries.push(node);
      } else {
        onlineEntries.push(node);
      }
    },
  );

  return { offlineEntries, onlineEntries };
}

export const DEFAULT_OFFLINE_STATES = {
  offlineItems: [],
};

export const offlineItemsResolvers = {
  Mutation: {},

  Query: { getOfflineItems: getOfflineItemsResolver },
};

export interface GetOfflineItemsSummary {
  completelyOfflineMap: OfflineExperienceSummaryMap;
  partialOnlineMap: OfflineExperienceSummaryMap;
  completelyOfflineCount: number;
  partlyOfflineCount: number;
}

interface OfflineExperienceSummaryMap {
  [K: string]: OfflineItemsSummary;
}

export interface OfflineItemsSummary {
  offlineEntries: ExperienceFragment_entries_edges_node[];
  experience: ExperienceFragment;
  onlineEntries: ExperienceFragment_entries_edges_node[];
}
