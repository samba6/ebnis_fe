import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { GetExps, GetExpsVariables } from "./apollo-types/GetExps";
import { EXPERIENCE_CONNECTION_FRAGMENT } from "./experience-connection.fragment";

export const GET_EXP_DEFS_QUERY = gql`
  query GetExps($pagination: PaginationInput!) {
    exps(pagination: $pagination) {
      ...ExperienceConnectionFragment
    }
  }

  ${EXPERIENCE_CONNECTION_FRAGMENT}
`;

export interface GetExpGqlProps {
  getExpDefsResult: DataValue<GetExps, GetExpsVariables>;
}
