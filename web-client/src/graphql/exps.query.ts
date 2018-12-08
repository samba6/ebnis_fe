import gql from "graphql-tag";
import { DataValue } from "react-apollo";

import { GetExps } from "./apollo-gql.d";
import { expFrag } from "./exp.fragment";

export const getExp = gql`
  query GetExps {
    exps {
      ...ExpFrag
    }
  }

  ${expFrag}
`;

export default getExp;

export type GetExpGqlProps = DataValue<GetExps>;
