import ApolloClient from "apollo-client";
import {
  GetAnExp,
  GetAnExpVariables
} from "../../graphql/apollo-types/GetAnExp";
import { GET_EXP_QUERY } from "../../graphql/get-exp.query";

export function preloadEntries(
  experiencesIds: string[],
  client: ApolloClient<{}>
) {
  Promise.all(
    experiencesIds.map(experienceId => {
      return client.query<GetAnExp, GetAnExpVariables>({
        query: GET_EXP_QUERY,
        variables: {
          exp: {
            id: experienceId
          },

          pagination: {
            first: 20
          }
        }
      });
    })
  );
}
