import { LocalResolverFn } from "../../state/resolvers";
import { CreateAnEntry_entry } from "../../graphql/apollo-types/CreateAnEntry";
import { GetAnExp_exp } from "../../graphql/apollo-types/GetAnExp";
import { makeUnsavedId } from "../../constants";
import { CreateField } from "../../graphql/apollo-types/globalTypes";
import gql from "graphql-tag";
import { graphql, MutationFn } from "react-apollo";
import { updateExperienceWithNewEntry } from "./update";

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
> = async (root, variables, { cache }) => {
  const {
    experience: { id: experienceId }
  } = variables;

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

  await updateExperienceWithNewEntry(experienceId)(cache, {
    data: { entry }
  });

  return entry;
};

interface CreateUnsavedEntryVariables {
  fields: CreateField[];
  experience: GetAnExp_exp;
}

export const resolvers = {
  Mutation: {
    createUnsavedEntry: createUnsavedEntryResolver
  }
};
