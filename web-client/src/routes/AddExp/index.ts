import { graphql } from "react-apollo";

import AddExp from "./add-exp-x";
import { OwnProps } from "./add-exp";
import GET_EXP_QUERY, {
  GetExperienceGqlProps
} from "../../graphql/get-exp.query";
import {
  GetAnExperience,
  GetAnExperienceVariables
} from "../../graphql/apollo-gql";

const getExpGql = graphql<
  OwnProps,
  GetAnExperience,
  GetAnExperienceVariables,
  GetExperienceGqlProps | undefined
>(GET_EXP_QUERY, {
  props: props => props.data,
  options: ({ match }) => {
    return {
      variables: {
        experience: {
          id: match.params.id
        }
      }
    };
  }
});

export default getExpGql(AddExp);
