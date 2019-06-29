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
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryReturned,
  UnsavedExperiencesQueryProps,
} from "../ExperienceDefinition/resolver-utils";

const expDefsGql = graphql<
  OwnProps,
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
  undefined | GetExperienceConnectionMiniProps
>(GET_EXPERIENCES_MINI_QUERY, {
  props: ({ data }) => data && { getExperiencesMiniProps: data },

  options: ({ client }) => {
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

const unsavedExperiencesGql = graphql<
  {},
  UnsavedExperiencesQueryReturned,
  {},
  UnsavedExperiencesQueryProps | undefined
>(UNSAVED_EXPERIENCES_QUERY, {
  props: ({ data }) =>
    data && {
      unsavedExperiencesProps: data,
    },
});

export const MyExperiences = compose(
  withApollo,
  expDefsGql,
  unsavedExperiencesGql,
)(Comp);

export default MyExperiences;
