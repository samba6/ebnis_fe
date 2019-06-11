import { graphql, compose, withApollo } from "react-apollo";

import { NewEntry as Comp } from "./component";
import { OwnProps } from "./utils";
import {
  CreateAnEntry,
  CreateAnEntryVariables
} from "../../graphql/apollo-types/CreateAnEntry";
import {
  CREATE_ENTRY_MUTATION,
  CreateEntryGqlProps
} from "../../graphql/create-entry.mutation";
import { getExperienceGql } from "../Experience/get-experience-gql";
import { getUnsavedExperienceGql } from "../Experience/get-unsaved-experience-gql";
import { createUnsavedEntryGql, resolvers } from "./resolvers";

const createEntryGql = graphql<
  {},
  CreateAnEntry,
  CreateAnEntryVariables,
  CreateEntryGqlProps | undefined
>(CREATE_ENTRY_MUTATION, {
  props: ({ mutate }) =>
    mutate && {
      createEntry: mutate
    }
});

// tslint:disable-next-line: prefer-const
let resolverAdded = false;

export const NewEntry = compose(
  withApollo,
  getExperienceGql<OwnProps>(resolvers, resolverAdded),
  getUnsavedExperienceGql<OwnProps>(),
  createEntryGql,
  createUnsavedEntryGql
)(Comp);

export default NewEntry;
