import ApolloClient from "apollo-client";
import {
  PreFetchExperiences,
  PreFetchExperiencesVariables
} from "../../graphql/apollo-types/PreFetchExperiences";
import { PRE_FETCH_EXPERIENCES_QUERY } from "../../graphql/exps.query";
import {
  GetAnExp,
  GetAnExpVariables
} from "../../graphql/apollo-types/GetAnExp";
import { GET_EXP_QUERY } from "../../graphql/get-exp.query";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";

export function preloadEntries({
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
        result && result.data && result.data.exps && result.data.exps.edges;

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

        client.writeQuery<GetAnExp, GetAnExpVariables>({
          query: GET_EXP_QUERY,

          variables: {
            exp: {
              id
            },

            entriesPagination
          },

          data: {
            exp: { ...experience, ...node }
          }
        });
      });
    });
}
