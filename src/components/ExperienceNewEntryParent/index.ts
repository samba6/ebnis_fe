import { graphql, compose, withApollo } from "react-apollo";
import { OwnProps } from "./utils";
import {
  UnsavedExperienceReturnedValue,
  UnsavedExperienceGqlProps,
  GET_UNSAVED_EXPERIENCE_QUERY,
  resolvers
} from "./resolvers";
import { isUnsavedId } from "../../constants";
import { ExperienceNewEntryParent as Comp } from "./component";
import {
  GET_EXP_QUERY,
  GetExperienceGqlProps
} from "../../graphql/get-exp.query";
import {
  GetAnExpVariables,
  GetAnExp
} from "../../graphql/apollo-types/GetAnExp";

let resolverAdded = false;

const unsavedExperienceGql = graphql<
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

  skip: ({ experienceId, client }) => {
    if (!resolverAdded) {
      client.addResolvers(resolvers);
      resolverAdded = true;
    }

    return !isUnsavedId(experienceId);
  }
});

const experienceGql = graphql<
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

  skip: ({ experienceId }) => {
    return isUnsavedId(experienceId);
  }
});

const ExperienceNewEntryParent = compose(
  withApollo,
  experienceGql,
  unsavedExperienceGql
)(Comp);

export default ExperienceNewEntryParent;
