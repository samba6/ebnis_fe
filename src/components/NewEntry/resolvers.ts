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
import { EXPERIENCE_FRAGMENT } from "../../graphql/experience.fragment";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";

const CREATE_UNSAVED_ENTRY_MUTATION = gql`
  mutation CreateUnsavedEntry($experience: Experience!, $fields: [Fields!]!) {
    createUnsavedEntry(experience: $experience, fields: $fields) @client {
      ...EntryFragment
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

interface CreateUnsavedEntryMutationReturned {
  createUnsavedEntry: CreateAnEntry_entry;
}

export const GET_UNSAVED_ENTRY_SAVED_EXPERIENCE_IDS_QUERY = gql`
  query {
    unsavedEntriesSavedExperiences @client {
      ...ExperienceFragment
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export interface UnsavedEntriesSavedExperiencesQueryReturned {
  unsavedEntriesSavedExperiences: ExperienceFragment[];
}

const createUnsavedEntryResolver: LocalResolverFn<
  CreateUnsavedEntryVariables,
  Promise<{
    entry: CreateAnEntry_entry;
    experience: UnsavedExperience;
    unsavedEntriesSavedExperiences: ExperienceFragment[] | null;
  }>
> = async (root, variables, context) => {
  const { cache } = context;

  let experience = variables.experience;

  const { id: experienceId, clientId: experienceClientId } = experience;
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
    expId: experienceClientId as string,
    fields,
    insertedAt: today.toJSON(),
    updatedAt: today.toJSON()
  };

  let unsavedEntriesSavedExperiences = null;

  if (isUnsavedId(experienceId)) {
    experience = updateUnsavedExperienceEntry(context, experience, entry);
  } else {
    experience = ((await updateSavedExperienceWithNewEntry(experienceId)(
      cache,
      {
        data: { entry }
      }
    )) as unknown) as UnsavedExperience;

    unsavedEntriesSavedExperiences = updateUnsavedEntriesSavedExperiences(
      context,
      (experience as unknown) as ExperienceFragment
    );
  }

  return { entry, experience, unsavedEntriesSavedExperiences };
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

  return newExperience;
}

function updateUnsavedEntriesSavedExperiences(
  { cache }: CacheContext,
  experience: ExperienceFragment
) {
  const data = cache.readQuery<UnsavedEntriesSavedExperiencesQueryReturned>({
    query: GET_UNSAVED_ENTRY_SAVED_EXPERIENCE_IDS_QUERY
  });

  const experienceId = experience.id;

  const unsavedEntriesSavedExperiences = immer(
    data ? data.unsavedEntriesSavedExperiences : [],
    proxy => {
      const index = proxy.findIndex(e => e.id === experienceId);

      if (index === -1) {
        proxy.push(experience);
      } else {
        proxy.splice(index, 1, experience);
      }
    }
  );

  cache.writeQuery<UnsavedEntriesSavedExperiencesQueryReturned>({
    query: GET_UNSAVED_ENTRY_SAVED_EXPERIENCE_IDS_QUERY,
    data: { unsavedEntriesSavedExperiences }
  });

  return unsavedEntriesSavedExperiences;
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
