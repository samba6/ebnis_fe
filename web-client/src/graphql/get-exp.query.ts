import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { fieldDefFragment } from "./field-def.fragment";
import { expDefFragment } from "./exp-def.fragment";
import { GetAnExpDef, GetAnExpDefVariables } from "./apollo-gql";

export const getExpDef = gql`
  query GetAnExpDef($expDef: GetExpDef!) {
    expDef(expDef: $expDef) {
      ...ExpDefFragment
      fieldDefs {
        ...FieldDefFragment
      }
    }
  }

  ${expDefFragment}
  ${fieldDefFragment}
`;

export default getExpDef;

export type GetExpDefGqlProps = DataValue<GetAnExpDef, GetAnExpDefVariables>;
