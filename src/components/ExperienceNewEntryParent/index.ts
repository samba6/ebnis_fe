import { graphql, compose, withApollo } from "react-apollo";
import { OwnProps } from "./utils";
import {
  UnsavedExperienceReturnedValue,
  UnsavedExperienceGqlProps,
  GET_UNSAVED_EXPERIENCE_QUERY,
  experienceNewEntryParentResolvers
} from "./resolvers";
import { isUnsavedId } from "../../constants";
import { ExperienceNewEntryParent as Comp } from "./component";
import {
  GET_EXP_QUERY,
  GetExperienceFullProps
} from "../../graphql/get-experience-full.query";
import {
  GetExperienceFullVariables,
  GetExperienceFull
} from "../../graphql/apollo-types/GetExperienceFull";

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
      client.addResolvers(experienceNewEntryParentResolvers);
      resolverAdded = true;
    }

    return !isUnsavedId(experienceId);
  }
});

const experienceGql = graphql<
  OwnProps,
  GetExperienceFull,
  GetExperienceFullVariables,
  GetExperienceFullProps | undefined
>(GET_EXP_QUERY, {
  props: ({ data }) => data && { getExperienceGql: data },

  options: ({ experienceId }) => {
    return {
      variables: {
        exp: {
          id: experienceId as string
        },

        entriesPagination: {
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
