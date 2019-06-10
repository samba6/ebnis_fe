import { graphql, compose, withApollo } from "react-apollo";

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
import { isUnsavedId } from "../../constants";
import {
  GET_UNSAVED_EXPERIENCE_QUERY,
  UnsavedExperienceReturnedValue,
  resolvers,
  UnsavedExperienceGqlProps
} from "./resolvers";

let resolverAdded = false;

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
  },

  skip: ({ experienceId, client }) => {
    if (!resolverAdded) {
      client.addResolvers(resolvers);

      resolverAdded = true;
    }

    return isUnsavedId(experienceId);
  }
});

const getUnsavedExperienceGql = graphql<
  OwnProps,
  UnsavedExperienceReturnedValue,
  {},
  UnsavedExperienceGqlProps | undefined
>(GET_UNSAVED_EXPERIENCE_QUERY, {
  props: ({ data }) =>
    data && {
      unsavedExperienceGql: data
    },

  options: ({ experienceId }) => {
    return {
      variables: {
        id: experienceId as string
      }
    };
  },

  skip: ({ experienceId }) => {
    return !isUnsavedId(experienceId);
  }
});

export const Experience = compose(
  withApollo,
  getUnsavedExperienceGql,
  getExpGql
)(Comp);
