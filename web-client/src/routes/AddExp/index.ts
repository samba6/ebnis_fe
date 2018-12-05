import { graphql } from "react-apollo";

import AddExp from "./add-exp-x";
import { OwnProps } from "./add-exp";
import GET_EXP_QUERY, { GetExpDefGqlProps } from "../../graphql/get-exp.query";
import { GetAnExpDef, GetAnExpDefVariables } from "../../graphql/apollo-gql";

const getExpGql = graphql<
  OwnProps,
  GetAnExpDef,
  GetAnExpDefVariables,
  GetExpDefGqlProps | undefined
>(GET_EXP_QUERY, {
  props: props => props.data,
  options: ({ match }) => {
    return {
      variables: {
        expDef: {
          id: match.params.id
        }
      }
    };
  }
});

export default getExpGql(AddExp);
