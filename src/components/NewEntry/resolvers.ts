import { LocalResolverFn, CacheContext } from "../../state/resolvers";
import { CreateAnEntry_entry } from "../../graphql/apollo-types/CreateAnEntry";
import { GetAnExp_exp_entries } from "../../graphql/apollo-types/GetAnExp";
import { makeUnsavedId, isUnsavedId } from "../../constants";
import { CreateField } from "../../graphql/apollo-types/globalTypes";
import gql from "graphql-tag";
import { graphql, MutationFn } from "react-apollo";
import { updateExperienceWithNewEntry as updateSavedExperienceWithNewEntry } from "./update";
import {
  UnsavedExperience,
  UNSAVED_EXPERIENCE_TYPENAME,
  UNSAVED_EXPERIENCE_FRAGMENT,
  UNSAVED_EXPERIENCE_FRAGMENT_NAME
} from "../ExperienceDefinition/resolver-utils";
import immer from "immer";
import { ENTRY_FRAGMENT } from "../../graphql/entry.fragment";

const CREATE_UNSAVED_ENTRY_MUTATION = gql`
  mutation CreateUnsavedEntry($experience: Experience!, $fields: [Fields!]!) {
    createUnsavedEntry(experience: $experience, fields: $fields) @client {
      ...EntryFragment
    }
  }

  ${ENTRY_FRAGMENT}
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

export const GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY = gql`
  query GetSavedExperiencesUnsavedEntries {
    savedExperiencesUnsavedEntries @client {
      ...EntryFragment
    }
  }

  ${ENTRY_FRAGMENT}
`;

export interface UnsavedEntriesQueryReturned {
  savedExperiencesUnsavedEntries: CreateAnEntry_entry[];
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
    clientId: id,
    expId: experienceId,
    fields,
    insertedAt: today.toJSON()
  };

  if (isUnsavedId(experienceId)) {
    updateUnsavedExperienceEntry(context, experience, entry);
  } else {
    await updateSavedExperienceWithNewEntry(experienceId)(cache, {
      data: { entry }
    });

    updateSavedExperiencesUnsavedEntries(context, entry);
  }

  return entry;
};

function updateUnsavedExperienceEntry(
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

async function updateSavedExperiencesUnsavedEntries(
  { cache }: CacheContext,
  entry: CreateAnEntry_entry
) {
  const data = cache.readQuery<UnsavedEntriesQueryReturned>({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY
  });

  const savedExperiencesUnsavedEntries = immer(
    data ? data.savedExperiencesUnsavedEntries : [],
    proxy => {
      proxy.push(entry);
    }
  );

  cache.writeQuery<UnsavedEntriesQueryReturned>({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
    data: { savedExperiencesUnsavedEntries }
  });
}

interface CreateUnsavedEntryVariables {
  fields: CreateField[];
  experience: UnsavedExperience;
}

export const newEntryResolvers = {
  Mutation: {
    createUnsavedEntry: createUnsavedEntryResolver
  },

  Query: {}
};
