import { LocalResolverFn } from "../../state/resolvers";
import { CreateExpMutationVariables } from "../../graphql/apollo-types/CreateExpMutation";
import { CreateFieldDef } from "../../graphql/apollo-types/globalTypes";
import { ExperienceAllFieldsFragment_fieldDefs } from "../../graphql/apollo-types/ExperienceAllFieldsFragment";
import { makeUnsavedId } from "../../constants";
import { graphql } from "react-apollo";
import { MutationFn } from "react-apollo";
import gql from "graphql-tag";
import {
  UNSAVED_EXPERIENCE_FRAGMENT,
  UnsavedExperience,
  UNSAVED_EXPERIENCE_TYPENAME,
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryValues
} from "./resolver-utils";

const createUnsavedExperienceResolver: LocalResolverFn<
  CreateExpMutationVariables,
  UnsavedExperience
> = (
  root,
  { exp: { description = null, title, fieldDefs: createFieldDefs } },
  { cache }
) => {
  const experienceId = makeUnsavedId(new Date().getTime());

  const fieldDefs: ExperienceAllFieldsFragment_fieldDefs[] = (createFieldDefs as CreateFieldDef[]).map(
    ({ name, type }, index) => {
      return {
        __typename: "FieldDef",
        name,
        type,
        id: experienceId + "--" + index
      };
    }
  );

  const experience: UnsavedExperience = {
    __typename: UNSAVED_EXPERIENCE_TYPENAME,
    id: experienceId,
    description,
    title,
    fieldDefs,
    entries: {
      __typename: "EntryConnection",
      edges: [],
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: false,
        hasPreviousPage: false
      }
    }
  };

  const data = cache.readQuery<UnsavedExperiencesQueryValues>({
    query: UNSAVED_EXPERIENCES_QUERY
  });

  const unsavedExperiences = [
    ...(data ? data.unsavedExperiences : []),
    experience
  ];

  cache.writeQuery<UnsavedExperiencesQueryValues>({
    query: UNSAVED_EXPERIENCES_QUERY,
    data: { unsavedExperiences }
  });

  return experience;
};

export const CREATE_UNSAVED_EXPERIENCE_MUTATION = gql`
  mutation CreateUnsavedExperienceMutation($exp: CreateExperience!) {
    createUnsavedExperience(exp: $exp) @client {
      ...UnsavedExperienceFragment
    }
  }

  ${UNSAVED_EXPERIENCE_FRAGMENT}
`;

export interface CreateUnsavedExperienceMutationData {
  createUnsavedExperience: UnsavedExperience;
}

type Fn = MutationFn<
  CreateUnsavedExperienceMutationData,
  CreateExpMutationVariables
>;

export interface CreateUnsavedExperienceMutationProps {
  createUnsavedExperience: Fn;
}

export const createUnsavedExperienceGql = graphql<
  {},
  CreateUnsavedExperienceMutationData,
  CreateExpMutationVariables,
  CreateUnsavedExperienceMutationProps | undefined
>(CREATE_UNSAVED_EXPERIENCE_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      createUnsavedExperience: mutate
    }
});

//////////////////////////// QUERIES /////////////////////////////////

//////////////////////////// END QUERIES ////////////////////////////

export const resolvers = {
  Mutation: {
    createUnsavedExperience: createUnsavedExperienceResolver
  },

  Query: {}
};
