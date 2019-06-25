import { LocalResolverFn, CacheContext } from "../../state/resolvers";
import { CreateEntryMutation_entry } from "../../graphql/apollo-types/CreateEntryMutation";
import { makeUnsavedId, isUnsavedId } from "../../constants";
import { CreateField } from "../../graphql/apollo-types/globalTypes";
import gql from "graphql-tag";
import { graphql, MutationFn } from "react-apollo";
import { updateExperienceWithNewEntry as updateSavedExperienceWithNewUnsavedEntry } from "./update";
import {
  UnsavedExperience,
  UNSAVED_EXPERIENCE_TYPENAME,
  UNSAVED_EXPERIENCE_FRAGMENT,
  UNSAVED_EXPERIENCE_FRAGMENT_NAME
} from "../ExperienceDefinition/resolver-utils";
import immer from "immer";
import { ENTRY_FRAGMENT } from "../../graphql/entry.fragment";
import {
  ExperienceFragment,
  ExperienceFragment_entries
} from "../../graphql/apollo-types/ExperienceFragment";
import { writeSavedExperiencesWithUnsavedEntriesToCache } from "../../state/resolvers-utils";
import {
  GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
  SavedExperiencesWithUnsavedEntriesQueryReturned
} from "../../state/unsaved-resolvers";

const CREATE_UNSAVED_ENTRY_MUTATION = gql`
  mutation CreateUnsavedEntry($experience: Experience!, $fields: [Fields!]!) {
    createUnsavedEntry(experience: $experience, fields: $fields) @client {
      entry {
        ...EntryFragment
      }
    }
  }

  ${ENTRY_FRAGMENT}
`;

// istanbul ignore next
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

type CreateUnsavedEntryTypename = "CreateUnsavedEntry";

const CREATE_UNSAVED_ENTRY_TYPENAME = "CreateUnsavedEntry" as CreateUnsavedEntryTypename;

interface CreateUnsavedEntryMutationReturned {
  createUnsavedEntry: {
    entry: CreateEntryMutation_entry;
    experience: UnsavedExperience;
    savedExperiencesWithUnsavedEntries: ExperienceFragment[] | null;
    __typename: CreateUnsavedEntryTypename;
  };
}

const createUnsavedEntryResolver: LocalResolverFn<
  CreateUnsavedEntryVariables,
  Promise<CreateUnsavedEntryMutationReturned["createUnsavedEntry"]>
> = async (root, variables, context) => {
  const { cache } = context;

  let experience = variables.experience;

  const { id: experienceId } = experience;
  const today = new Date();

  const id = makeUnsavedId(today.getTime());

  const fields = variables.fields.map(field => {
    return {
      ...field,
      __typename: "Field" as "Field"
    };
  });

  const entry: CreateEntryMutation_entry = {
    __typename: "Entry",
    id,
    clientId: id,
    expId: experienceId,
    fields,
    insertedAt: today.toJSON(),
    updatedAt: today.toJSON()
  };

  let savedExperiencesWithUnsavedEntries = null;

  if (isUnsavedId(experienceId)) {
    experience = updateUnsavedExperienceEntry(context, experience, entry);
  } else {
    experience = ((await updateSavedExperienceWithNewUnsavedEntry(experienceId)(
      cache,
      {
        data: { entry }
      }
    )) as unknown) as UnsavedExperience;

    savedExperiencesWithUnsavedEntries = updateSavedExperiencesWithUnsavedEntries(
      context,
      (experience as unknown) as ExperienceFragment
    );
  }

  return {
    entry,
    experience,
    savedExperiencesWithUnsavedEntries,
    __typename: CREATE_UNSAVED_ENTRY_TYPENAME
  };
};

function updateUnsavedExperienceEntry(
  { cache, getCacheKey }: CacheContext,
  experience: UnsavedExperience,
  entry: CreateEntryMutation_entry
) {
  const id = experience.id;

  const cacheId = getCacheKey({
    __typename: UNSAVED_EXPERIENCE_TYPENAME,
    id
  });

  const newExperience = immer(experience, proxy => {
    const entries = proxy.entries as ExperienceFragment_entries;
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

  return newExperience;
}

function updateSavedExperiencesWithUnsavedEntries(
  { cache }: CacheContext,
  experience: ExperienceFragment
) {
  const data = cache.readQuery<SavedExperiencesWithUnsavedEntriesQueryReturned>(
    {
      query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY
    }
  );

  const experienceId = experience.id;

  const savedExperiencesWithUnsavedEntries = immer(
    data ? data.savedExperiencesWithUnsavedEntries : [],
    proxy => {
      const index = proxy.findIndex(e => e.id === experienceId);

      if (index === -1) {
        proxy.push(experience);
      } else {
        proxy.splice(index, 1, experience);
      }
    }
  );

  writeSavedExperiencesWithUnsavedEntriesToCache(
    cache,
    savedExperiencesWithUnsavedEntries
  );

  return savedExperiencesWithUnsavedEntries;
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
