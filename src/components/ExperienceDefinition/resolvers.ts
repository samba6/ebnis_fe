import { LocalResolverFn } from "../../state/resolvers";
import { CreateExperienceMutationVariables } from "../../graphql/apollo-types/CreateExperienceMutation";
import { CreateFieldDef } from "../../graphql/apollo-types/globalTypes";
import { makeUnsavedId } from "../../constants";
import { graphql } from "react-apollo";
import { MutationFn } from "react-apollo";
import gql from "graphql-tag";
import {
  ExperienceFragment_fieldDefs,
  ExperienceFragment,
} from "../../graphql/apollo-types/ExperienceFragment";
import { EXPERIENCE_FRAGMENT } from "../../graphql/experience.fragment";
import { writeGetExperienceFullQueryToCache } from "../../state/resolvers/write-get-experience-full-query-to-cache";
import { insertExperienceInGetExperiencesMiniQuery } from "../../state/resolvers/update-get-experiences-mini-query";
import { UpdateEntriesCountSavedAndUnsavedExperiencesInCache } from "../../state/resolvers/update-entries-count-saved-and-unsaved-experiences-in-cache";

const createUnsavedExperienceResolver: LocalResolverFn<
  CreateExperienceMutationVariables,
  ExperienceFragment
> = (
  root,
  {
    createExperienceInput: {
      description = null,
      title,
      fieldDefs: createFieldDefs,
    },
  },
  { cache, client },
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
        clientId: fieldDefId,
      };
    },
  );

  const experience: ExperienceFragment = {
    __typename: "Experience",
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
        hasPreviousPage: false,
      },
    },
  };

  writeGetExperienceFullQueryToCache(cache, experience, {
    writeFragment: false,
  });
  insertExperienceInGetExperiencesMiniQuery(cache, experience, {
    force: true,
  });
  UpdateEntriesCountSavedAndUnsavedExperiencesInCache(client, experienceId);
  return experience;
};

export const CREATE_UNSAVED_EXPERIENCE_MUTATION = gql`
  mutation CreateUnsavedExperienceMutation(
    $createExperienceInput: CreateExperienceInput!
  ) {
    createUnsavedExperience(createExperienceInput: $createExperienceInput)
      @client {
      ...ExperienceFragment
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export interface CreateUnsavedExperienceMutationData {
  createUnsavedExperience: ExperienceFragment;
}

type Fn = MutationFn<
  CreateUnsavedExperienceMutationData,
  CreateExperienceMutationVariables
>;

export interface CreateUnsavedExperienceMutationProps {
  createUnsavedExperience: Fn;
}

export const createUnsavedExperienceGql = graphql<
  {},
  CreateUnsavedExperienceMutationData,
  CreateExperienceMutationVariables,
  CreateUnsavedExperienceMutationProps | undefined
>(CREATE_UNSAVED_EXPERIENCE_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      createUnsavedExperience: mutate,
    },
});
//////////////////////////// QUERIES /////////////////////////////////

//////////////////////////// END QUERIES ////////////////////////////

export const experienceDefinitionResolvers = {
  Mutation: {
    createUnsavedExperience: createUnsavedExperienceResolver,
  },

  Query: {},
};
