import { DataProxy } from "apollo-cache";
import {
  GetExperienceFullVariables,
  GetExperienceFull,
} from "../../graphql/apollo-types/GetExperienceFull";
import { GET_EXPERIENCE_FULL_QUERY } from "../../graphql/get-experience-full.query";

export function readGetExperienceFullQueryFromCache(
  dataProxy: DataProxy,
  experienceId: string,
) {
  const variables: GetExperienceFullVariables = {
    id: experienceId,
    entriesPagination: {
      first: 20,
    },
  };

  const data = dataProxy.readQuery<
    GetExperienceFull,
    GetExperienceFullVariables
  >({
    query: GET_EXPERIENCE_FULL_QUERY,
    variables,
  });

  return data && data.getExperience;
}
