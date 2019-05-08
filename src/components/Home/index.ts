import { graphql } from "react-apollo";

import { Home as Comp } from "./home-x";
import { GetExps } from "../../graphql/apollo-gql";
import EXP_DEFS_QUERY, { GetExpGqlProps } from "../../graphql/exps.query";
import { OwnProps } from "./home";

const expDefsGql = graphql<OwnProps, GetExps, {}, undefined | GetExpGqlProps>(
  EXP_DEFS_QUERY,
  {
    props: props => props.data,

    options() {
      return {
        fetchPolicy: "cache-and-network"
      };
    }
  }
);

export const Home = expDefsGql(Comp);
