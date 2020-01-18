/* istanbul ignore file */
import ApolloClient from "apollo-client";
import { DataProxy } from "apollo-cache";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../graphql/apollo-types/GetExperienceConnectionMini";
import {
  GET_EXPERIENCES_MINI_QUERY,
  getExperienceConnectionMiniVariables,
} from "../graphql/get-experience-connection-mini.query";

export const readOptions = {
  query: GET_EXPERIENCES_MINI_QUERY,
  variables: getExperienceConnectionMiniVariables,
};

export async function getExperiencesMiniQuery(dataProxy: DataProxy) {
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

  return getExperiences;
}
