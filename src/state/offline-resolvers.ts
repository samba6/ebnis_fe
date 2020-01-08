import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node,
} from "../graphql/apollo-types/ExperienceFragment";
import gql from "graphql-tag";
import { isOfflineId } from "../constants";
import { queryCacheOfflineItems } from "./resolvers/get-experiences-from-cache";
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
  const results = queryCacheOfflineItems(cache);

  return results.reduce((acc, { id, offlineEntriesCount }) => {
    acc += offlineEntriesCount;

    if (isOfflineId(id)) {
      // offline experience (not part offline experience)
      ++acc;
    }

    return acc;
  }, 0);
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

export const DEFAULT_OFFLINE_STATES = {
  offlineItems: [],
};
