import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { GetExps, GetExpsVariables } from "./apollo-types/GetExps";
import {
  EXPERIENCE_MINI_FRAGMENT,
  EXPERIENCE_CONNECTION_PRE_FETCH_FRAGMENT
} from "./experience.fragment";

export const GET_EXP_DEFS_QUERY = gql`
  query GetExps($input: GetExperiencesInput) {
    exps(input: $input) {
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

export type GetExperiencesData = DataValue<GetExps, GetExpsVariables>;

export interface GetExperiencesProps {
  getExpDefsResult: GetExperiencesData;
}

export const PRE_FETCH_EXPERIENCES_QUERY = gql`
  query PreFetchExperiences(
    $experiencesArgs: GetExperiencesInput
    $entriesPagination: PaginationInput
  ) {
    exps(input: $experiencesArgs) {
      ...ExperienceConnectionPreFetchFragment
    }
  }

  ${EXPERIENCE_CONNECTION_PRE_FETCH_FRAGMENT}
`;
