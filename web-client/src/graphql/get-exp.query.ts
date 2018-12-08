import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { fieldDefFrag } from "./field-def.fragment";
import { expFrag } from "./exp.fragment";
import { GetAnExp, GetAnExpVariables } from "./apollo-gql.d";

export const getExp = gql`
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

export default getExp;

export type GetExpGqlProps = DataValue<GetAnExp, GetAnExpVariables>;
