import { graphql } from "react-apollo";

import { Experiences as Comp } from "./experiences-x";
import { GetExps } from "../../graphql/apollo-types/GetExps";
import { GetExpGqlProps, GET_EXP_DEFS_QUERY } from "../../graphql/exps.query";
import { OwnProps } from "./experiences";

const expDefsGql = graphql<OwnProps, GetExps, {}, undefined | GetExpGqlProps>(
  GET_EXP_DEFS_QUERY,
  {
    props: ({ data }) => data && { getExpDefsResult: data },

    options() {
      return {
        fetchPolicy: "cache-and-network"
      };
    }
  }
);

export const Experiences = expDefsGql(Comp);
