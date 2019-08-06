import { DataProxy } from "apollo-cache";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../graphql/apollo-types/GetExperienceConnectionMini";
import { GET_EXPERIENCES_MINI_QUERY } from "../graphql/get-experience-connection-mini.query";
import immer from "immer";
import { ExperienceConnectionFragment } from "../graphql/apollo-types/ExperienceConnectionFragment";

// in case we are updating with unsaved experiences now saved and we did not
// previously have GET_EXPERIENCES query
const DEFAULT_EXPERIENCE_CONNECTION: ExperienceConnectionFragment = {
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    __typename: "PageInfo",
  },

  edges: [],

  __typename: "ExperienceConnection",
};

export function updateGetExperiencesQuery(
  dataProxy: DataProxy,
  experiences: ExperienceFragment[],
) {
  const variables: GetExperienceConnectionMiniVariables = {
    input: {
      pagination: {
        first: 20000,
      },
    },
  };

  const experiencesMiniQuery = dataProxy.readQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    query: GET_EXPERIENCES_MINI_QUERY,
    variables,
  });

  const getExperiences =
    (experiencesMiniQuery && experiencesMiniQuery.getExperiences) ||
    DEFAULT_EXPERIENCE_CONNECTION;

  const updatedExperienceConnection = immer(getExperiences, proxy => {
    const edges = (getExperiences.edges || []).concat(
      experiences.map(e => ({
        node: e,
        cursor: "",
        __typename: "ExperienceEdge",
      })),
    );

    proxy.edges = edges;
  });

  dataProxy.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    query: GET_EXPERIENCES_MINI_QUERY,
    variables,
    data: { getExperiences: updatedExperienceConnection },
  });
}
