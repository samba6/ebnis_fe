import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { fieldDefFrag } from "./field-def.fragment";
import { expFrag } from "./exp.fragment";
import { GetAnExp, GetAnExpVariables } from "./apollo-types/GetAnExp";

export const GET_EXP_QUERY = gql`
  query GetAnExp($exp: GetExp!) {
    exp(exp: $exp) {
      ...ExpFrag
      fieldDefs {
        ...FieldDefFrag
      }
    }
  }

  ${expFrag}
  ${fieldDefFrag}
`;

export type GetExperienceGqlValues = DataValue<GetAnExp, GetAnExpVariables>;

export interface GetExperienceGqlProps {
  getExperienceGql: GetExperienceGqlValues;
}
