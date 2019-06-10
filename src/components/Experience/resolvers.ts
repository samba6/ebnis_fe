import gql from "graphql-tag";
import { LocalResolverFn } from "../../state/resolvers";
import {
  UNSAVED_EXPERIENCE_FRAGMENT,
  UnsavedExperience,
  UnsavedExperiencesQueryValues,
  UNSAVED_EXPERIENCES_QUERY
} from "../ExperienceDefinition/resolver-utils";
import { DataValue } from "react-apollo";

export const GET_UNSAVED_EXPERIENCE_QUERY = gql`
  query GetUnsavedExperience($id: String!, $pagination: PaginationInput) {
    unsavedExperience(id: $id, pagination: $pagination) @client {
      ...UnsavedExperienceFragment
    }
  }

  ${UNSAVED_EXPERIENCE_FRAGMENT}
`;

export interface UnsavedExperienceReturnedValue {
  unsavedExperience?: UnsavedExperience;
}

export type UnsavedExperienceDataValue = DataValue<
  UnsavedExperienceReturnedValue
>;

export interface UnsavedExperienceGqlProps {
  unsavedExperienceGql: UnsavedExperienceDataValue;
}

export interface UnsavedExperienceVariables {
  id: string;
}

export const unsavedExperienceResolver: LocalResolverFn<
  UnsavedExperienceVariables,
  Promise<UnsavedExperience | undefined>
> = async (root, { id }, { cache }) => {
  const data = cache.readQuery<UnsavedExperiencesQueryValues>({
    query: UNSAVED_EXPERIENCES_QUERY
  });

  const unsavedExperience = (data ? data.unsavedExperiences : []).find(
    experience => experience.id === id
  );

  return unsavedExperience;
};

export const resolvers = {
  Mutation: {},

  Query: {
    unsavedExperience: unsavedExperienceResolver
  }
};
