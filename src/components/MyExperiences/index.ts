import { graphql, compose, withApollo } from "react-apollo";

import { MyExperiences as Comp } from "./component";
import { GetExps, GetExpsVariables } from "../../graphql/apollo-types/GetExps";
import {
  GetExperiencesProps,
  GET_EXP_DEFS_QUERY
} from "../../graphql/exps.query";
import { OwnProps } from "./utils";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryReturned,
  UnsavedExperiencesQueryProps
} from "../ExperienceDefinition/resolver-utils";

const expDefsGql = graphql<
  OwnProps,
  GetExps,
  GetExpsVariables,
  undefined | GetExperiencesProps
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
  UnsavedExperiencesQueryReturned,
  {},
  UnsavedExperiencesQueryProps | undefined
>(UNSAVED_EXPERIENCES_QUERY, {
  props: ({ data }) =>
    data && {
      unsavedExperiencesProps: data
    }
});

export const MyExperiences = compose(
  withApollo,
  expDefsGql,
  unsavedExperiencesGql
)(Comp);

export default MyExperiences;
