import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { GetExps } from "./apollo-types/GetExps";
import { expFrag } from "./exp.fragment";

export const GET_EXP_DEFS_QUERY = gql`
  query GetExps {
    exps {
      ...ExpFrag
    }
  }

  ${expFrag}
`;

export interface GetExpGqlProps {
  getExpDefsResult: DataValue<GetExps>;
}
