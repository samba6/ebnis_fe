import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { QueryResult } from "@apollo/react-common";
import { LocalResolverFn } from "../../state/resolvers";
import { readExperienceFragment } from "../../apollo-cache/read-experience-fragment";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries,
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
    const experience = readExperienceFragment(cache, id);

    if (experience) {
      if (isOfflineId(id)) {
        ++completelyOfflineCount;

        completelyOfflineMap[id] = {
          experience,
          offlineEntries: entryNodesFromExperience(experience),
        };
      } else {
        ++partialOnlineCount;

        // we really do not want to carry the entries around because it could
        // contain a large number of items depending on entries pagination
        // size
        const partOfflineExperience = {
          ...experience,
          entries: (null as unknown) as ExperienceFragment_entries,
        };

        partialOnlineMap[id] = {
          experience: partOfflineExperience,
          offlineEntries: getOfflineEntriesFromExperience(experience),
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

export function useGetAllOfflineItemsQuery() {
  return useQuery<GetOfflineItemsQueryReturned, {}>(GET_OFFLINE_ITEMS_QUERY);
}

export interface UseGetAllOfflineItemsProps {
  loading?: boolean;
  allOfflineItems?: GetOfflineItemsSummary;
}

function getOfflineEntriesFromExperience({ entries }: ExperienceFragment) {
  return ((entries.edges as ExperienceFragment_entries_edges[]) || []).reduce(
    (acc, edge: ExperienceFragment_entries_edges) => {
      const node = edge.node as ExperienceFragment_entries_edges_node;

      if (isOfflineId(node.id) || node.modOffline) {
        acc.push(node);
      }

      return acc;
    },
    [] as ExperienceFragment_entries_edges_node[],
  );
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
}
