/* istanbul ignore file */
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

export function getExperiencesMiniQuery(cache: DataProxy) {
  let getExperiences;

  try {
    const data = cache.readQuery<
      GetExperienceConnectionMini,
      GetExperienceConnectionMiniVariables
    >(readOptions);

    getExperiences = data && data.getExperiences;
  } catch (error) {
    // throw error;
  }

  return getExperiences;
}
