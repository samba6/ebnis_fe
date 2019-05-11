import React from "react";
import { graphql } from "react-apollo";

import { Home as Comp } from "./home-x";
import { GetExps } from "../../graphql/apollo-types/GetExps";
import { GetExpGqlProps, GET_EXP_DEFS_QUERY } from "../../graphql/exps.query";
import { OwnProps, Props } from "./home";
import { SidebarHeader } from "../SidebarHeader";

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

function HomeComp(props: Pick<Props, Exclude<keyof Props, "SidebarHeader">>) {
  return <Comp {...props} SidebarHeader={SidebarHeader} />;
}

export const Home = expDefsGql(HomeComp);
