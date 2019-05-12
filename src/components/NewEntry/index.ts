import { graphql, compose } from "react-apollo";

import { NewEntry as Comp } from "./component";
import { OwnProps } from "./utils";
import {
  GET_EXP_QUERY,
  GetExperienceGqlProps
} from "../../graphql/get-exp.query";
import {
  CreateAnEntry,
  CreateAnEntryVariables
} from "../../graphql/apollo-types/CreateAnEntry";
import {
  CREATE_ENTRY_MUTATION,
  CreateEntryGqlProps
} from "../../graphql/create-entry.mutation";
import {
  GetAnExp,
  GetAnExpVariables
} from "../../graphql/apollo-types/GetAnExp";

const getExpGql = graphql<
  OwnProps,
  GetAnExp,
  GetAnExpVariables,
  GetExperienceGqlProps | undefined
>(GET_EXP_QUERY, {
  props: ({ data }) => data && { getExperienceGql: data },
  options: ({ experienceId }) => {
    return {
      variables: {
        exp: {
          id: experienceId as string
        }
      }
    };
  }
});

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

export const NewEntry = compose(
  getExpGql,
  createEntryGql
)(Comp);
