import ApolloClient from "apollo-client";
import {
  PreFetchExperiences,
  PreFetchExperiencesVariables,
} from "../../graphql/apollo-types/PreFetchExperiences";
import { PRE_FETCH_EXPERIENCES_QUERY } from "../../graphql/get-experience-connection-mini.query";

export function preFetchExperiences({
  ids,
  client,
  onDone,
}: {
  ids: string[];
  client: ApolloClient<{}>;
  onDone: () => void;
}) {
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
    .then(onDone);
}
