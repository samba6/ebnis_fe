import { graphql, compose, withApollo } from "react-apollo";

import { MyExperiences as Comp } from "./component";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../../graphql/apollo-types/GetExperienceConnectionMini";
import {
  GetExperienceConnectionMiniProps,
  GET_EXPERIENCES_MINI_QUERY,
} from "../../graphql/get-experience-connection-mini.query";
import { OwnProps } from "./utils";

const getExperienceConnectionMiniGql = graphql<
  OwnProps,
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
  undefined | GetExperienceConnectionMiniProps
>(GET_EXPERIENCES_MINI_QUERY, {
  props: ({ data }) => data && { getExperiencesMiniProps: data },

  options: () => {
    return {
      variables: {
        input: {
          pagination: {
            first: 20,
          },
        },
      },
    };
  },
});

export const MyExperiences = compose(
  withApollo,
  getExperienceConnectionMiniGql,
)(Comp);

export default MyExperiences;
