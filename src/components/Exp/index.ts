import { graphql, compose } from "react-apollo";

import { Exp as Comp } from "./exp-x";
import { OwnProps } from "./exp";
import { GET_EXP_QUERY, GetExpGqlProps } from "../../graphql/get-exp.query";
import {
  GetAnExp,
  GetAnExpVariables
} from "../../graphql/apollo-types/GetAnExp";
import {
  GET_EXP_ENTRIES_QUERY,
  GetExpEntriesGqlProps
} from "../../graphql/exp-entries.query";
import {
  GetExpAllEntries,
  GetExpAllEntriesVariables
} from "../../graphql/apollo-types/GetExpAllEntries";

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
          id: match.params.id
        }
      },
      fetchPolicy: "cache-and-network"
    };
  }
});

const getExpEntriesGql = graphql<
  OwnProps,
  GetExpAllEntries,
  GetExpAllEntriesVariables,
  GetExpEntriesGqlProps | undefined
>(GET_EXP_ENTRIES_QUERY, {
  props: props => props.data,
  options: ({ match }) => {
    return {
      variables: {
        entry: {
          expId: match.params.id
        }
      },

      fetchPolicy: "cache-and-network"
    };
  }
});

export const Exp = compose(
  getExpGql,
  getExpEntriesGql
)(Comp);
