import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { fieldDefFrag } from "./field-def.fragment";
import { expFrag } from "./exp.fragment";
import { GetAnExp, GetAnExpVariables } from "./apollo-types/GetAnExp";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";

export const GET_EXP_QUERY = gql`
  query GetAnExp($exp: GetExp!, $pagination: PaginationInput!) {
    exp(exp: $exp) {
      ...ExpFrag

      fieldDefs {
        ...FieldDefFrag
      }

      entries(pagination: $pagination) {
        ...EntryConnectionFragment
      }
    }
  }

  ${expFrag}
  ${fieldDefFrag}
  ${ENTRY_CONNECTION_FRAGMENT}
`;

export type GetExperienceGqlValues = DataValue<GetAnExp, GetAnExpVariables>;

export interface GetExperienceGqlProps {
  getExperienceGql?: GetExperienceGqlValues;
}
