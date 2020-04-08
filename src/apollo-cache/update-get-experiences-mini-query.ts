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

export const DEFAULT_EXPERIENCE_MINI_CONNECTION: GetExperienceConnectionMini_getExperiences = {
  pageInfo: {
    __typename: "PageInfo",
    hasNextPage: false,
    hasPreviousPage: false,
  },
  __typename: "ExperienceConnection",
  edges: [],
};

export function insertExperienceInGetExperiencesMiniQuery(
  dataProxy: DataProxy,
  experience: ExperienceFragment,
  { force }: { force?: boolean } = {},
) {
  const experienceConnection = getExperiencesMiniQuery(dataProxy);

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

export function insertExperiencesInGetExperiencesMiniQuery(
  dataProxy: DataProxy,
  experiences: (ExperienceMiniFragment | null)[],
) {
  const experienceConnection =
    getExperiencesMiniQuery(dataProxy) || DEFAULT_EXPERIENCE_MINI_CONNECTION;

  const updatedExperienceConnection = immer(experienceConnection, proxy => {
    const edges = (proxy.edges || []) as ExperienceConnectionFragment_edges[];

    proxy.edges = experiences
      .map(e => {
        return {
          node: e,
          cursor: "",
          __typename: "ExperienceEdge" as "ExperienceEdge",
        };
      })
      .concat(edges);
  });

  dataProxy.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    ...readOptions,
    data: { getExperiences: updatedExperienceConnection },
  });
}

export function floatExperienceToTheTopInGetExperiencesMiniQuery(
  dataProxy: DataProxy,
  experience: ExperienceMiniFragment,
) {
  const experienceConnection =
    getExperiencesMiniQuery(dataProxy) || DEFAULT_EXPERIENCE_MINI_CONNECTION;

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

  newEdges[0] =
    experienceEdge ||
    ({
      node: experience,
      cursor: "",
      __typename: EXPERIENCE_EDGE_TYPE_NAME,
    } as ExperienceConnectionFragment_edges);

  dataProxy.writeQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    ...readOptions,
    data: { getExperiences: { ...experienceConnection, edges: newEdges } },
  });
}

export function floatExperiencesToTopInGetExperiencesMiniQuery(
  dataProxy: DataProxy,
  ids: { [k: string]: number },
) {
  const experienceConnection = getExperiencesMiniQuery(dataProxy);

  if (!experienceConnection) {
    return;
  }

  const updatedExperienceConnection = immer(experienceConnection, proxy => {
    const edges = (proxy.edges || []) as ExperienceConnectionFragment_edges[];

    // 5 is an arbitrary number, we just need len > edges.length
    const len = edges.length + 5;

    proxy.edges = edges.sort((a, b) => {
      const id1 = ((a as ExperienceConnectionFragment_edges)
        .node as ExperienceConnectionFragment_edges_node).id;

      const id2 = ((b as ExperienceConnectionFragment_edges)
        .node as ExperienceConnectionFragment_edges_node).id;

      return (ids[id1] || len) - (ids[id2] || len);
    });
  });

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
export function replaceExperiencesInGetExperiencesMiniQuery(
  client: ApolloClient<{}>,
  experiencesMap: { [k: string]: ExperienceFragment | null },
) {
  const experiences =
    getExperiencesMiniQuery(client) || DEFAULT_EXPERIENCE_MINI_CONNECTION;

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
