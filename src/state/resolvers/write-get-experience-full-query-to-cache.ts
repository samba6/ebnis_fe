import { DataProxy } from "apollo-cache";
import {
  GetExperienceFull,
  GetExperienceFullVariables,
} from "../../graphql/apollo-types/GetExperienceFull";
import { GET_EXPERIENCE_FULL_QUERY } from "../../graphql/get-experience-full.query";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";

export function writeGetExperienceFullQueryToCache(
  dataProxy: DataProxy,
  experience: ExperienceFragment,
) {
  dataProxy.writeQuery<GetExperienceFull, GetExperienceFullVariables>({
    query: GET_EXPERIENCE_FULL_QUERY,

    variables: {
      id: experience.id,

      entriesPagination: {
        first: 20,
      },
    },

    data: {
      getExperience: experience,
    },
  });
}
