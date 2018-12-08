import { graphql } from "react-apollo";

import Home from "./home-x";
import { GetExps } from "../../graphql/apollo-gql.d";
import EXP_DEFS_QUERY, { GetExpGqlProps } from "../../graphql/exps.query";
import { OwnProps } from "./home";

const expDefsGql = graphql<OwnProps, GetExps, {}, undefined | GetExpGqlProps>(
  EXP_DEFS_QUERY,
  {
    props: props => props.data
  }
);

export default expDefsGql(Home);
