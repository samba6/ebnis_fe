import { graphql, compose } from "react-apollo";

import { NewEntry as Comp } from "./new-entry-x";
import { OwnProps } from "./new-entry";
import { GET_EXP_QUERY, GetExpGqlProps } from "../../graphql/get-exp.query";
import {
  CreateAnEntry,
  CreateAnEntryVariables
} from "../../graphql/apollo-types/CreateAnEntry";
import {
  CREATE_ENTRY_MUTATION,
  CreateEntryFn,
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
  GetExpGqlProps | undefined
>(GET_EXP_QUERY, {
  props: props => props.data,
  options: ({ match }) => {
    return {
      variables: {
        exp: {
          id: match.params.expId
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
  props: props => {
    const mutate = props.mutate as CreateEntryFn;

    return {
      createEntry: mutate
    };
  }
});

export const NewEntry = compose(
  getExpGql,
  createEntryGql
)(Comp);
