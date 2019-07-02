import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../../graphql/apollo-types/GetExperienceConnectionMini";
import { GET_EXPERIENCES_MINI_QUERY } from "../../graphql/get-experience-connection-mini.query";
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
  const variables: GetExperienceConnectionMiniVariables = {
    input: {
      pagination: {
        first: 20,
      },
    },
  };

  const readOptions = {
    query: GET_EXPERIENCES_MINI_QUERY,
    variables,
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
    const data = dataProxy.readQuery<
      GetExperienceConnectionMini,
      GetExperienceConnectionMiniVariables
    >(readOptions);

    getExperiences = data && data.getExperiences;
  }

  if (!getExperiences && !force) {
    return;
  }

  const updatedExperienceConnection = immer(
    (getExperiences ||
      DEFAULT_EXPERIENCE_CONNECTION) as ExperienceConnectionFragment,
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
    ...readOptions,
    data: { getExperiences: updatedExperienceConnection },
  });
}

export async function replaceExperiencesInGetExperiencesMiniQuery(
  client: ApolloClient<{}>,
  experiencesMap: { [k: string]: ExperienceFragment },
) {
  const variables: GetExperienceConnectionMiniVariables = {
    input: {
      pagination: {
        first: 20,
      },
    },
  };

  const readOptions = {
    query: GET_EXPERIENCES_MINI_QUERY,
    variables,
  };

  const { data } = await client.query<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >({
    ...readOptions,
    fetchPolicy: "cache-only",
  });

  let getExperiences = data && data.getExperiences;

  const updatedExperienceConnection = immer(
    (getExperiences ||
      DEFAULT_EXPERIENCE_CONNECTION) as ExperienceConnectionFragment,
    proxy => {
      const edges = proxy.edges || [];

      for (let edge of edges) {
        edge = edge as ExperienceConnectionFragment_edges;
        const node = edge.node as ExperienceConnectionFragment_edges_node;
        const replacementExperience = experiencesMap[node.id];

        if (replacementExperience) {
          edge.node = replacementExperience;
        }
      }

      proxy.edges = edges;
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
