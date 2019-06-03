import { LocalResolverFn } from "../../state/resolvers";
import { CreateExpMutationVariables } from "../../graphql/apollo-types/CreateExpMutation";
import { CreateFieldDef } from "../../graphql/apollo-types/globalTypes";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryValues
} from "../../state/unsaved-experiences.query";
import {
  ExperienceAllFieldsFragment,
  ExperienceAllFieldsFragment_fieldDefs
} from "../../graphql/apollo-types/ExperienceAllFieldsFragment";

const createExperienceResolver: LocalResolverFn<
  CreateExpMutationVariables
> = async (
  root,
  { exp: { description = null, title, fieldDefs: createFieldDefs } },
  { cache }
) => {
  const today = new Date().getTime() + "";

  const fieldDefs: ExperienceAllFieldsFragment_fieldDefs[] = (createFieldDefs as CreateFieldDef[]).map(
    ({ name, type }, index) => {
      return {
        __typename: "FieldDef",
        name,
        type,
        id: today + "--" + index
      };
    }
  );

  const experience: ExperienceAllFieldsFragment = {
    __typename: "Experience",
    id: today,
    description,
    title,
    fieldDefs
  };

  const data = cache.readQuery<UnsavedExperiencesQueryValues>({
    query: UNSAVED_EXPERIENCES_QUERY
  }) as UnsavedExperiencesQueryValues;

  const { unsavedExperiences } = data;

  await cache.writeQuery({
    query: UNSAVED_EXPERIENCES_QUERY,

    data: {
      unsavedExperiences: [...unsavedExperiences, experience]
    }
  });

  return experience;
};

export const resolvers = {
  Mutation: {
    createUnsavedExperience: createExperienceResolver
  },

  Query: {}
};
