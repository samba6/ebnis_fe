import { LocalResolverFn } from "../../state/resolvers";
import { makeUnsavedId } from "../../constants";
import { CreateField } from "../../graphql/apollo-types/globalTypes";
import gql from "graphql-tag";
import { graphql, MutationFn } from "react-apollo";
import { updateExperienceWithNewEntry } from "./update";
import { ENTRY_FRAGMENT } from "../../graphql/entry.fragment";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { updateEntriesCountSavedAndUnsavedExperiencesInCache } from "../../state/resolvers/update-saved-and-unsaved-experiences-in-cache";

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
      createUnsavedEntry: mutate,
    },
});

export interface CreateUnsavedEntryMutationProps {
  createUnsavedEntry: MutationFn<
    CreateUnsavedEntryMutationReturned,
    CreateUnsavedEntryVariables
  >;
}

interface CreateUnsavedEntryMutationReturned {
  createUnsavedEntry: {
    id: string;
    entry: EntryFragment;
    experience: ExperienceFragment;
    __typename: "Entry";
  };
}

const createUnsavedEntryResolver: LocalResolverFn<
  CreateUnsavedEntryVariables,
  Promise<CreateUnsavedEntryMutationReturned["createUnsavedEntry"]>
> = async (root, variables, context) => {
  const { client } = context;

  let experience = variables.experience;

  const { id: experienceId } = experience;
  const today = new Date();
  const timestamps = today.toJSON();

  const id = makeUnsavedId(today.getTime());

  const fields = variables.fields.map(field => {
    return {
      ...field,
      __typename: "Field" as "Field",
    };
  });

  const entry: EntryFragment = {
    __typename: "Entry",
    id,
    clientId: id,
    expId: experienceId,
    fields,
    insertedAt: timestamps,
    updatedAt: timestamps,
  };

  experience = (await updateExperienceWithNewEntry(experience)(client, {
    data: { createEntry: entry },
  })) as ExperienceFragment;

  updateEntriesCountSavedAndUnsavedExperiencesInCache(client, experienceId);

  return { id, experience, entry, __typename: "Entry" };
};

interface CreateUnsavedEntryVariables {
  fields: CreateField[];
  experience: ExperienceFragment;
}

export const newEntryResolvers = {
  Mutation: {
    createUnsavedEntry: createUnsavedEntryResolver,
  },

  Query: {},
};
