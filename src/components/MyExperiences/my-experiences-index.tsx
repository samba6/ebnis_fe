import React from "react";
import { graphql, compose, withApollo } from "react-apollo";
import { MyExperiences as Comp } from "./my-experiences.component";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../../graphql/apollo-types/GetExperienceConnectionMini";
import {
  GetExperienceConnectionMiniProps,
  GET_EXPERIENCES_MINI_QUERY,
} from "../../graphql/get-experience-connection-mini.query";
import { OwnProps, Props } from "./my-experiences.utils";

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
            first: 20000,
          },
        },
      },
    };
  },
});

export const MyExperiences = compose(
  withApollo,
  getExperienceConnectionMiniGql,
)((props: Props) => (
  <Comp
    searchDebounceTimeoutMs={250}
    cleanUpOnSearchExit={cancellable => {
      cancellable.cancel();
    }}
    {...props}
  />
));

export default MyExperiences;
