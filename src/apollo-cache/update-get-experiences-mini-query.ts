import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
  GetExperienceConnectionMini_getExperiences,
} from "../graphql/apollo-types/GetExperienceConnectionMini";
import immer from "immer";
import ApolloClient from "apollo-client";
import { DataProxy } from "apollo-cache";
import {
  ExperienceConnectionFragment_edges,
  ExperienceConnectionFragment_edges_node,
} from "../graphql/apollo-types/ExperienceConnectionFragment";
import { ExperienceMiniFragment } from "../graphql/apollo-types/ExperienceMiniFragment";
import {
  getExperiencesMiniQuery,
  readOptions,
} from "./get-experiences-mini-query";
import { EXPERIENCE_EDGE_TYPE_NAME } from "../graphql/types";

const DEFAULT_EXPERIENCE_MINI_CONNECTION: GetExperienceConnectionMini_getExperiences = {
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
  { force }: { force?: boolean } = {},
) {
  const experienceConnection = await getExperiencesMiniQuery(dataProxy);

  if (!experienceConnection && !force) {
    return;
  }

  const updatedExperienceConnection = immer(
    experienceConnection || DEFAULT_EXPERIENCE_MINI_CONNECTION,
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

export async function floatExperienceToTheTopInGetExperiencesMiniQuery(
  dataProxy: DataProxy,
  experience: ExperienceMiniFragment,
) {
  const experienceConnection =
    (await getExperiencesMiniQuery(dataProxy)) ||
    DEFAULT_EXPERIENCE_MINI_CONNECTION;

  const edges = (experienceConnection.edges ||
    []) as ExperienceConnectionFragment_edges[];

  const newEdges: ExperienceConnectionFragment_edges[] = [
    {} as ExperienceConnectionFragment_edges,
  ];

  let experienceEdge = (undefined as unknown) as ExperienceConnectionFragment_edges;

  edges.forEach(e => {
    const edge = e as ExperienceConnectionFragment_edges;
    const node = edge.node as ExperienceConnectionFragment_edges_node;

    if (node.id === experience.id) {
      experienceEdge = edge;
    } else {
      newEdges.push(edge);
    }
  });

  newEdges[0] = experienceEdge || {
    node: experience,
    cursor: "",
    __typename: EXPERIENCE_EDGE_TYPE_NAME,
  };

  dataProxy.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    ...readOptions,
    data: { getExperiences: { ...experienceConnection, edges: newEdges } },
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
  const experiences =
    (await getExperiencesMiniQuery(client)) ||
    DEFAULT_EXPERIENCE_MINI_CONNECTION;

  const updatedExperienceConnection = immer(experiences, proxy => {
    const edges = (proxy.edges || []) as ExperienceConnectionFragment_edges[];
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
  });

  client.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    ...readOptions,
    data: { getExperiences: updatedExperienceConnection },
  });
}
