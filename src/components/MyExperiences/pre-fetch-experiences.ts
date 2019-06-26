import ApolloClient from "apollo-client";
import {
  PreFetchExperiences,
  PreFetchExperiencesVariables
} from "../../graphql/apollo-types/PreFetchExperiences";
import { PRE_FETCH_EXPERIENCES_QUERY } from "../../graphql/get-experience-connection-mini.query";
import {
  GetExperienceFull,
  GetExperienceFullVariables
} from "../../graphql/apollo-types/GetExperienceFull";
import { GET_EXPERIENCE_FULL_QUERY } from "../../graphql/get-experience-full.query";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";

export function preFetchExperiences({
  ids,
  client,
  idToExperienceMap
}: {
  ids: string[];
  client: ApolloClient<{}>;
  idToExperienceMap: { [k: string]: ExperienceMiniFragment };
}) {
  const entriesPagination = {
    first: 20
  };

  client
    .query<PreFetchExperiences, PreFetchExperiencesVariables>({
      query: PRE_FETCH_EXPERIENCES_QUERY,
      variables: {
        experiencesArgs: {
          ids,
          pagination: entriesPagination
        },

        entriesPagination
      }
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

        client.writeQuery<GetExperienceFull, GetExperienceFullVariables>({
          query: GET_EXPERIENCE_FULL_QUERY,

          variables: {
            id,

            entriesPagination
          },

          data: {
            getExperience: { ...experience, ...node }
          }
        });
      });
    });
}
