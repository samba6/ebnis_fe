import { graphql, compose } from "react-apollo";

import { Experience as Comp } from "./component";
import { OwnProps } from "./utils";
import {
  GET_EXP_QUERY,
  GetExperienceGqlProps
} from "../../graphql/get-exp.query";
import {
  GetAnExp,
  GetAnExpVariables
} from "../../graphql/apollo-types/GetAnExp";

const getExpGql = graphql<
  OwnProps,
  GetAnExp,
  GetAnExpVariables,
  GetExperienceGqlProps | undefined
>(GET_EXP_QUERY, {
  props: ({ data }) => data && { getExperienceGql: data },

  options: ({ experienceId }) => {
    return {
      variables: {
        exp: {
          id: experienceId as string
        },

        pagination: {
          first: 20
        }
      }
    };
  }
});

export const Experience = compose(getExpGql)(Comp);
