import gql from "graphql-tag";
import { QueryResult } from "@apollo/react-common";
import { LocalResolverFn } from "../../state/resolvers";
import { readExperienceFragmentFromCache } from "../../state/resolvers/read-get-experience-full-query-from-cache";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges,
} from "../../graphql/apollo-types/ExperienceFragment";
import { queryCacheOfflineItems } from "../../state/resolvers/get-experiences-from-cache";
import { isOfflineId } from "../../constants";
import { entryNodesFromExperience } from "../../state/offline-resolvers";

export const GET_OFFLINE_ITEMS_QUERY = gql`
  {
    getOfflineItems @client
  }
`;

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
    const experience = readExperienceFragmentFromCache(cache, id);

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

export const getAllOfflineItemsResolvers = {
  Mutation: {},
  Query: { getOfflineItems: getOfflineItemsResolver },
};

import { useQuery } from "@apollo/react-hooks";

export function useGetAllOfflineItemsQuery() {
  return useQuery<GetOfflineItemsQueryReturned, {}>(GET_OFFLINE_ITEMS_QUERY);
}

export interface UseGetAllOfflineItemsProps {
  loading?: boolean;
  allOfflineItems?: GetOfflineItemsSummary;
}

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

////////////////////////// TYPES ////////////////////////////

export interface GetOfflineItemsSummary {
  completelyOfflineMap: OfflineExperienceSummaryMap;
  partialOnlineMap: OfflineExperienceSummaryMap;
  completelyOfflineCount: number;
  partlyOfflineCount: number;
}

export interface GetOfflineItemsQueryReturned {
  getOfflineItems: GetOfflineItemsSummary;
}

export const QUERY_NAME_getOfflineItems = "getOfflineItems";

export type GetOfflineItemsQueryResult = QueryResult<
  GetOfflineItemsQueryReturned
>;

interface OfflineExperienceSummaryMap {
  [K: string]: OfflineItemsSummary;
}

export interface OfflineItemsSummary {
  offlineEntries: ExperienceFragment_entries_edges_node[];
  experience: ExperienceFragment;
  onlineEntries: ExperienceFragment_entries_edges_node[];
}
