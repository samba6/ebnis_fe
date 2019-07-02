import ApolloClient from "apollo-client";
import {
  PreFetchExperiences,
  PreFetchExperiencesVariables,
} from "../../graphql/apollo-types/PreFetchExperiences";
import { PRE_FETCH_EXPERIENCES_QUERY } from "../../graphql/get-experience-connection-mini.query";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";
import { writeGetExperienceFullQueryToCache } from "../../state/resolvers/write-get-experience-full-query-to-cache";
import { isUnsavedId } from "../../constants";

export function preFetchExperiences({
  ids,
  client,
  idToExperienceMap,
}: {
  ids: string[];
  client: ApolloClient<{}>;
  idToExperienceMap: { [k: string]: ExperienceMiniFragment };
}) {
  ids = ids.filter(id => !isUnsavedId(id));

  if (ids.length === 0) {
    return;
  }

  const entriesPagination = {
    first: 20,
  };

  client
    .query<PreFetchExperiences, PreFetchExperiencesVariables>({
      query: PRE_FETCH_EXPERIENCES_QUERY,
      variables: {
        experiencesArgs: {
          ids,
          pagination: entriesPagination,
        },

        entriesPagination,
      },
    })
    .then(result => {
      const edges =
        result &&
        result.data &&
        result.data.getExperiences &&
        result.data.getExperiences.edges;

      if (!edges) {
        return;
      }

      edges.forEach(edge => {
        const node = edge && edge.node;

        if (!node) {
          return;
        }

        const { id } = node;
        const experience = idToExperienceMap[id];

        if (!experience) {
          return;
        }

        writeGetExperienceFullQueryToCache(
          client,
          { ...experience, ...node },
          {
            writeFragment: true,
          },
        );
      });
    });
}
