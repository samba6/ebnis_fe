import gql from "graphql-tag";
import { QueryResult } from "@apollo/react-common";
import { useQuery } from "@apollo/react-hooks";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "./apollo-types/GetExperienceConnectionMini";
import {
  EXPERIENCE_MINI_FRAGMENT,
  EXPERIENCE_CONNECTION_PRE_FETCH_FRAGMENT,
} from "./experience.fragment";
import { WatchQueryFetchPolicy } from "apollo-client";

// this query will be kept around after we ran it and all experiences list will
// refer to it.
export const GET_EXPERIENCES_MINI_QUERY = gql`
  query GetExperienceConnectionMini($input: GetExperiencesInput) {
    getExperiences(input: $input) {
      pageInfo {
        hasNextPage
        hasPreviousPage
      }

      edges {
        cursor
        node {
          ...ExperienceMiniFragment
        }
      }
    }
  }

  ${EXPERIENCE_MINI_FRAGMENT}
`;

export type GetExperienceConnectionMiniQueryResult = QueryResult<
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables
>;

// this query will be deleted after we ran it.
export const PRE_FETCH_EXPERIENCES_QUERY = gql`
  query PreFetchExperiences(
    $input: GetExperiencesInput!
    $entriesPagination: PaginationInput!
  ) {
    getExperiences(input: $input) {
      ...ExperienceConnectionPreFetchFragment
    }
  }

  ${EXPERIENCE_CONNECTION_PRE_FETCH_FRAGMENT}
`;

export const getExperienceConnectionMiniVariables: GetExperienceConnectionMiniVariables = {
  input: {
    pagination: {
      first: 20000,
    },
  },
};

export function useGetExperienceMiniQueryFn(
  fetchPolicy: WatchQueryFetchPolicy,
) {
  return useQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >(GET_EXPERIENCES_MINI_QUERY, {
    variables: getExperienceConnectionMiniVariables,
    fetchPolicy,
  });
}
