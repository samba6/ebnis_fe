import { graphql, compose } from "react-apollo";

import { Experience as Comp } from "./component";
import { OwnProps } from "./utils";
import {
  GET_EXP_QUERY,
  GetExperienceGqlProps
} from "../../graphql/get-exp.query";
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
  GetExperienceGqlProps | undefined
>(GET_EXP_QUERY, {
  props: ({ data }) => data && { getExperienceGql: data },
  options: ({ experienceId }) => {
    return {
      variables: {
        exp: {
          id: experienceId as string
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
  options: ({ experienceId }) => {
    return {
      variables: {
        entry: {
          expId: experienceId as string
        }
      },

      fetchPolicy: "cache-and-network"
    };
  }
});

export const Experience = compose(
  getExpEntriesGql,
  getExpGql
)(Comp);
