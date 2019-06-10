import { graphql } from "react-apollo";
import gql from "graphql-tag";
import { isUnsavedId } from "../../constants";
import {
  UnsavedExperienceReturnedValue,
  UnsavedExperienceGqlProps
} from "./resolvers";
import ApolloClient from "apollo-client";
import { UNSAVED_EXPERIENCE_FRAGMENT } from "../ExperienceDefinition/resolver-utils";

export const GET_UNSAVED_EXPERIENCE_QUERY = gql`
  query GetUnsavedExperience($id: String!, $pagination: PaginationInput) {
    unsavedExperience(id: $id, pagination: $pagination) @client {
      ...UnsavedExperienceFragment
    }
  }

  ${UNSAVED_EXPERIENCE_FRAGMENT}
`;

export function getUnsavedExperienceGql<
  T extends { experienceId?: string; client: ApolloClient<{}> }
>() {
  return graphql<
    T,
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
}
