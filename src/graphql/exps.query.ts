import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { GetExps, GetExpsVariables } from "./apollo-types/GetExps";

export const GET_EXP_DEFS_QUERY = gql`
  query GetExps($pagination: PaginationInput!) {
    exps(pagination: $pagination) {
      pageInfo {
        hasNextPage
        hasPreviousPage
      }

      edges {
        cursor
        node {
          id
          title
          description
          clientId
          insertedAt
          updatedAt
        }
      }
    }
  }
`;

export type GetExperiencesData = DataValue<GetExps, GetExpsVariables>;

export interface GetExperiencesProps {
  getExpDefsResult: GetExperiencesData;
}
