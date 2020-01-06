import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../../graphql/apollo-types/GetExperienceConnectionMini";
import {
  GET_EXPERIENCES_MINI_QUERY,
  getExperienceConnectionMiniVariables,
} from "../../graphql/get-experience-connection-mini.query";
import immer from "immer";
import ApolloClient from "apollo-client";
import { DataProxy } from "apollo-cache";
import {
  ExperienceConnectionFragment_edges,
  ExperienceConnectionFragment,
  ExperienceConnectionFragment_edges_node,
} from "../../graphql/apollo-types/ExperienceConnectionFragment";

const DEFAULT_EXPERIENCE_CONNECTION: ExperienceConnectionFragment = {
  pageInfo: {
    __typename: "PageInfo",
    hasNextPage: false,
    hasPreviousPage: false,
  },
  __typename: "ExperienceConnection",
  edges: [],
};

export async function insertExperienceInGetExperiencesMiniQuery(
  dataProxy: DataProxy,
  experience: ExperienceFragment,
  { force = false }: { force?: boolean },
) {
  const readOptions = {
    query: GET_EXPERIENCES_MINI_QUERY,
    variables: getExperienceConnectionMiniVariables,
  };

  let getExperiences;

  if (dataProxy instanceof ApolloClient) {
    const { data } = await dataProxy.query<
      GetExperienceConnectionMini,
      GetExperienceConnectionMiniVariables
    >({
      ...readOptions,
      fetchPolicy: "cache-only",
    });

    getExperiences = data && data.getExperiences;
  } else {
    try {
      const data = dataProxy.readQuery<
        GetExperienceConnectionMini,
        GetExperienceConnectionMiniVariables
      >(readOptions);

      getExperiences = data && data.getExperiences;
    } catch (error) {
      if (
        !(error as Error).message.includes("Can't find field getExperiences")
      ) {
        throw error;
      }
    }
  }

  if (!getExperiences && !force) {
    return;
  }

  const updatedExperienceConnection = immer(
    (getExperiences ||
      DEFAULT_EXPERIENCE_CONNECTION) as ExperienceConnectionFragment,
    proxy => {
      const edges = proxy.edges || [];

      edges.unshift({
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
    ...readOptions,
    data: { getExperiences: updatedExperienceConnection },
  });
}

/**
 * When null is supplied in the map, it means the experience will be removed
 * from the query
 */
export async function replaceExperiencesInGetExperiencesMiniQuery(
  client: ApolloClient<{}>,
  experiencesMap: { [k: string]: ExperienceFragment | null },
) {
  const readOptions = {
    query: GET_EXPERIENCES_MINI_QUERY,
    variables: getExperienceConnectionMiniVariables,
  };

  const { data } = await client.query<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    ...readOptions,
    fetchPolicy: "cache-only",
  });

  const getExperiences = data && data.getExperiences;

  const updatedExperienceConnection = immer(
    (getExperiences ||
      DEFAULT_EXPERIENCE_CONNECTION) as ExperienceConnectionFragment,
    proxy => {
      const edges = proxy.edges || [];
      const newEdges: ExperienceConnectionFragment_edges[] = [];

      for (let edge of edges) {
        edge = edge as ExperienceConnectionFragment_edges;
        const node = edge.node as ExperienceConnectionFragment_edges_node;
        const replacementExperience = experiencesMap[node.id];

        // value is null, so skip ==== delete.
        if (replacementExperience === null) {
          continue;
        }

        if (replacementExperience) {
          edge.node = replacementExperience;
        }

        newEdges.push(edge);
      }

      proxy.edges = newEdges;
    },
  );

  client.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    ...readOptions,
    data: { getExperiences: updatedExperienceConnection },
  });
}
