import { graphql, compose } from "react-apollo";

import Exp from "./exp-x";
import { OwnProps } from "./exp";
import GET_EXP_QUERY, { GetExpGqlProps } from "../../graphql/get-exp.query";
import {
  GetAnExp,
  GetAnExpVariables,
  GetExpAllEntries,
  GetExpAllEntriesVariables
} from "../../graphql/apollo-gql.d";
import GET_EXP_ENTRIES_QUERY, {
  GetExpEntriesGqlProps
} from "../../graphql/exp-entries.query";

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
      }
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
      }
    };
  }
});

export default compose(
  getExpGql,
  getExpEntriesGql
)(Exp);
