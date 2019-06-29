import { LocalResolverFn } from "../../state/resolvers";
import gql from "graphql-tag";
import {
  UNSAVED_EXPERIENCE_FRAGMENT,
  UNSAVED_EXPERIENCE_TYPENAME,
  UNSAVED_EXPERIENCE_FRAGMENT_NAME,
} from "../ExperienceDefinition/resolver-utils";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { DataValue } from "react-apollo";
import { ApolloError } from "apollo-client";
import { GraphQLError } from "graphql";

export const unsavedExperienceResolver: LocalResolverFn<
  UnsavedExperienceVariables,
  UnsavedExperience
> = (root, { id }, { cache, getCacheKey }) => {
  const cacheId = getCacheKey({
    __typename: UNSAVED_EXPERIENCE_TYPENAME,
    id,
  });

  const experience = cache.readFragment<UnsavedExperience>({
    fragment: UNSAVED_EXPERIENCE_FRAGMENT,
    id: cacheId,
    fragmentName: UNSAVED_EXPERIENCE_FRAGMENT_NAME,
  });

  if (experience) {
    return experience;
  }

  throw new ApolloError({
    graphQLErrors: [new GraphQLError(`Unknown unsaved experience ID: ${id}`)],
  });
};

export interface UnsavedExperienceVariables {
  id: string;
}

export interface UnsavedExperiencesQueryValues {
  unsavedExperiences: UnsavedExperience[];
}

export const GET_UNSAVED_EXPERIENCE_QUERY = gql`
  query GetUnsavedExperience($id: String!, $pagination: PaginationInput) {
    unsavedExperience(id: $id, pagination: $pagination) @client {
      ...UnsavedExperienceFragment
    }
  }

  ${UNSAVED_EXPERIENCE_FRAGMENT}
`;

type UnsavedExperienceTypename = "UnsavedExperience";

export type UnsavedExperience = Pick<
  ExperienceFragment,
  Exclude<keyof ExperienceFragment, "__typename">
> & {
  __typename: UnsavedExperienceTypename;
};

export interface UnsavedExperienceReturnedValue {
  unsavedExperience?: UnsavedExperience;
}

export type UnsavedExperienceDataValue = DataValue<
  UnsavedExperienceReturnedValue
>;

export interface UnsavedExperienceGqlProps {
  unsavedExperienceGql?: UnsavedExperienceDataValue;
}

export const experienceNewEntryParentResolvers = {
  Mutation: {},

  Query: {
    unsavedExperience: unsavedExperienceResolver,
  },
};
