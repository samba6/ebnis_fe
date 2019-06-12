import { graphql, compose, withApollo } from "react-apollo";

import { MyExperiences as Comp } from "./component";
import { GetExps, GetExpsVariables } from "../../graphql/apollo-types/GetExps";
import { GetExpGqlProps, GET_EXP_DEFS_QUERY } from "../../graphql/exps.query";
import { OwnProps } from "./utils";
import { connectionGql } from "../../state/connection.resolver";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryValues
} from "../ExperienceDefinition/resolver-utils";

const expDefsGql = graphql<
  OwnProps,
  GetExps,
  GetExpsVariables,
  undefined | GetExpGqlProps
>(GET_EXP_DEFS_QUERY, {
  props: ({ data }) => data && { getExpDefsResult: data },

  options: ({ client }) => {
    return {
      variables: {
        pagination: {
          first: 20
        }
      }
    };
  }
});

const unsavedExperiencesGql = graphql<
  {},
  UnsavedExperiencesQueryValues,
  {},
  UnsavedExperiencesQueryValues | undefined
>(UNSAVED_EXPERIENCES_QUERY, {
  props: ({ data }) =>
    data && {
      unsavedExperiences: data.unsavedExperiences || []
    }
});

export const MyExperiences = compose(
  withApollo,
  connectionGql,
  expDefsGql,
  unsavedExperiencesGql
)(Comp);

export default MyExperiences;
