import { graphql, compose } from "react-apollo";

import { NewEntry as Comp } from "./component";
import { OwnProps } from "./utils";
import {
  CreateEntryMutation,
  CreateEntryMutationVariables,
} from "../../graphql/apollo-types/CreateEntryMutation";
import {
  CREATE_ENTRY_MUTATION,
  CreateEntryMutationProps,
} from "../../graphql/create-entry.mutation";
import { createUnsavedEntryGql, newEntryResolvers } from "./resolvers";

// tslint:disable-next-line: prefer-const
let resolverAdded = false;

const createEntryGql = graphql<
  OwnProps,
  CreateEntryMutation,
  CreateEntryMutationVariables,
  CreateEntryMutationProps | undefined
>(CREATE_ENTRY_MUTATION, {
  props: ({ mutate, ownProps: { client } }) => {
    if (!resolverAdded) {
      client.addResolvers(newEntryResolvers);
      resolverAdded = true;
    }

    return (
      mutate && {
        createEntry: mutate,
      }
    );
  },
});

export const NewEntry = compose(
  createEntryGql,
  createUnsavedEntryGql,
)(Comp);

export default NewEntry;
