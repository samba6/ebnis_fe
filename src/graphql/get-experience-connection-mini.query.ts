import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "./apollo-types/GetExperienceConnectionMini";
import {
  EXPERIENCE_MINI_FRAGMENT,
  EXPERIENCE_CONNECTION_PRE_FETCH_FRAGMENT,
} from "./experience.fragment";

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

export type GetExperienceConnectionMiniData = DataValue<
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables
>;

export interface GetExperienceConnectionMiniProps {
  getExperiencesMiniProps: GetExperienceConnectionMiniData;
}

export const PRE_FETCH_EXPERIENCES_QUERY = gql`
  query PreFetchExperiences(
    $experiencesArgs: GetExperiencesInput
    $entriesPagination: PaginationInput!
  ) {
    getExperiences(input: $experiencesArgs) {
      ...ExperienceConnectionPreFetchFragment
    }
  }

  ${EXPERIENCE_CONNECTION_PRE_FETCH_FRAGMENT}
`;
