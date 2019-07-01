import { DataProxy } from "apollo-cache";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
  GetExperienceConnectionMini_getExperiences,
} from "../../graphql/apollo-types/GetExperienceConnectionMini";
import { GET_EXPERIENCES_MINI_QUERY } from "../../graphql/get-experience-connection-mini.query";
import immer from "immer";

export function updateGetExperienceConnectionMiniQuery(
  dataProxy: DataProxy,
  experience: ExperienceFragment,
  { force = false }: { force?: boolean },
) {
  const variables: GetExperienceConnectionMiniVariables = {
    input: {
      pagination: {
        first: 20,
      },
    },
  };

  const data = dataProxy.readQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    query: GET_EXPERIENCES_MINI_QUERY,
    variables,
  });

  let getExperiences = data && data.getExperiences;

  if (!getExperiences && !force) {
    return;
  }

  const updatedExperienceConnection = immer(
    (getExperiences || {}) as GetExperienceConnectionMini_getExperiences,
    proxy => {
      const edges = proxy.edges || [];

      edges.push({
        node: experience,
        cursor: "",
        __typename: "ExperienceEdge",
      });

      proxy.edges = edges;
    },
  );

  dataProxy.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    query: GET_EXPERIENCES_MINI_QUERY,
    variables,
    data: { getExperiences: updatedExperienceConnection },
  });
}
