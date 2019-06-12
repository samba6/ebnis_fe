import { LocalResolverFn, CacheContext } from "../../state/resolvers";
import { CreateAnEntry_entry } from "../../graphql/apollo-types/CreateAnEntry";
import { GetAnExp_exp_entries } from "../../graphql/apollo-types/GetAnExp";
import { makeUnsavedId, isUnsavedId } from "../../constants";
import { CreateField } from "../../graphql/apollo-types/globalTypes";
import gql from "graphql-tag";
import { graphql, MutationFn } from "react-apollo";
import { updateExperienceWithNewEntry } from "./update";
import {
  UnsavedExperience,
  UNSAVED_EXPERIENCE_TYPENAME,
  UNSAVED_EXPERIENCE_FRAGMENT,
  UNSAVED_EXPERIENCE_FRAGMENT_NAME
} from "../ExperienceDefinition/resolver-utils";
import immer from "immer";

const CREATE_UNSAVED_ENTRY_MUTATION = gql`
  mutation CreateUnsavedEntry($experience: Experience!, $fields: [Fields!]!) {
    createUnsavedEntry(experience: $experience, fields: $fields) @client
  }
`;

export const createUnsavedEntryGql = graphql<
  {},
  CreateUnsavedEntryMutationReturned,
  CreateUnsavedEntryVariables,
  CreateUnsavedEntryMutationProps | undefined
>(CREATE_UNSAVED_ENTRY_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      createUnsavedEntry: mutate
    }
});

export interface CreateUnsavedEntryMutationProps {
  createUnsavedEntry: MutationFn<
    CreateUnsavedEntryMutationReturned,
    CreateUnsavedEntryVariables
  >;
}

interface CreateUnsavedEntryMutationReturned {
  createUnsavedEntry: CreateAnEntry_entry;
}

const createUnsavedEntryResolver: LocalResolverFn<
  CreateUnsavedEntryVariables,
  Promise<CreateAnEntry_entry>
> = async (root, variables, context) => {
  const { cache } = context;

  const { experience } = variables;

  const experienceId = experience.id;
  const today = new Date();

  const id = makeUnsavedId(today.getTime());

  const fields = variables.fields.map(field => {
    return {
      ...field,
      __typename: "Field" as "Field"
    };
  });

  const entry: CreateAnEntry_entry = {
    __typename: "Entry",
    id,
    _id: id,
    expId: experienceId,
    fields,
    insertedAt: today.toJSON()
  };

  if (isUnsavedId(experienceId)) {
    updateUnsavedExperiencesWithNewEntry(context, experience, entry);
  } else {
    await updateExperienceWithNewEntry(experienceId)(cache, {
      data: { entry }
    });
  }

  return entry;
};

function updateUnsavedExperiencesWithNewEntry(
  { cache, getCacheKey }: CacheContext,
  experience: UnsavedExperience,
  entry: CreateAnEntry_entry
) {
  const id = experience.id;

  const cacheId = getCacheKey({
    __typename: UNSAVED_EXPERIENCE_TYPENAME,
    id
  });

  const newExperience = immer(experience, proxy => {
    const entries = proxy.entries as GetAnExp_exp_entries;
    const edges = entries.edges || [];
    edges.push({
      node: entry,
      cursor: "",
      __typename: "EntryEdge"
    });

    entries.edges = edges;
    proxy.entries = entries;
  });

  cache.writeFragment({
    fragment: UNSAVED_EXPERIENCE_FRAGMENT,
    id: cacheId,
    fragmentName: UNSAVED_EXPERIENCE_FRAGMENT_NAME,
    data: newExperience
  });
}

interface CreateUnsavedEntryVariables {
  fields: CreateField[];
  experience: UnsavedExperience;
}

export const resolvers = {
  Mutation: {
    createUnsavedEntry: createUnsavedEntryResolver
  }
};
