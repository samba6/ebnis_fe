import { graphql } from "react-apollo";

import Exp from "./exp-x";
import { OwnProps } from "./exp";
import GET_EXP_QUERY, { GetExpGqlProps } from "../../graphql/get-exp.query";
import { GetAnExp, GetAnExpVariables } from "../../graphql/apollo-gql.d";

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

export default getExpGql(Exp);
