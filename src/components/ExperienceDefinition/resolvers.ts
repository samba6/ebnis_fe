import { LocalResolverFn } from "../../state/resolvers";
import { CreateExpMutationVariables } from "../../graphql/apollo-types/CreateExpMutation";
import { CreateFieldDef } from "../../graphql/apollo-types/globalTypes";
import { makeUnsavedId } from "../../constants";
import { graphql } from "react-apollo";
import { MutationFn } from "react-apollo";
import gql from "graphql-tag";
import {
  UNSAVED_EXPERIENCE_FRAGMENT,
  UnsavedExperience,
  UNSAVED_EXPERIENCE_TYPENAME
} from "./resolver-utils";
import { ExperienceFragment_fieldDefs } from "../../graphql/apollo-types/ExperienceFragment";
import {
  getUnsavedExperiencesFromCache,
  writeUnsavedExperiencesFromCache
} from "../../state/resolvers-utils";

const createUnsavedExperienceResolver: LocalResolverFn<
  CreateExpMutationVariables,
  UnsavedExperience
> = (
  root,
  { exp: { description = null, title, fieldDefs: createFieldDefs } },
  { cache }
) => {
  const today = new Date();
  const timestamp = today.toJSON();
  const experienceId = makeUnsavedId(today.getTime());

  const fieldDefs: ExperienceFragment_fieldDefs[] = (createFieldDefs as CreateFieldDef[]).map(
    ({ name, type }, index) => {
      const fieldDefId = experienceId + "--" + index;

      return {
        __typename: "FieldDef",
        name,
        type,
        id: fieldDefId,
        clientId: fieldDefId
      };
    }
  );

  const experience: UnsavedExperience = {
    __typename: UNSAVED_EXPERIENCE_TYPENAME,
    id: experienceId,
    clientId: experienceId,
    insertedAt: timestamp,
    updatedAt: timestamp,
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

  const unsavedExperiences = [
    ...getUnsavedExperiencesFromCache(cache),
    experience
  ];

  writeUnsavedExperiencesFromCache(cache, unsavedExperiences);

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

export const experienceDefinitionResolvers = {
  Mutation: {
    createUnsavedExperience: createUnsavedExperienceResolver
  },

  Query: {}
};
