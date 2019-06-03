import { graphql, compose, withApollo } from "react-apollo";

import { MyExperiences as Comp } from "./component";
import { GetExps } from "../../graphql/apollo-types/GetExps";
import { GetExpGqlProps, GET_EXP_DEFS_QUERY } from "../../graphql/exps.query";
import { OwnProps } from "./utils";
import { connectionGql } from "../../state/conn.query";
import { unsavedExperiencesGql } from "./local.queries";
import { resolvers } from "./resolvers";

let resolverAdded = false;

const expDefsGql = graphql<OwnProps, GetExps, {}, undefined | GetExpGqlProps>(
  GET_EXP_DEFS_QUERY,
  {
    props: ({ data }) => data && { getExpDefsResult: data },

    options: ({ client }) => {
      if (!resolverAdded) {
        client.addResolvers(resolvers);
      }

      resolverAdded = true;

      return {};
    }
  }
);

export const MyExperiences = compose(
  withApollo,
  connectionGql,
  expDefsGql,
  unsavedExperiencesGql
)(Comp);
