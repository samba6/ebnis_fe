import { DataProxy } from "apollo-cache";
import {
  GetExperienceFull,
  GetExperienceFullVariables,
} from "../../graphql/apollo-types/GetExperienceFull";
import { GET_EXPERIENCE_FULL_QUERY } from "../../graphql/get-experience-full.query";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { writeExperienceFragmentToCache } from "../../apollo-cache/write-experience-fragment";

export function writeGetExperienceFullQueryToCache(
  dataProxy: DataProxy,
  experience: ExperienceFragment,
  { writeFragment }: { writeFragment: boolean },
) {
  const { id } = experience;

  const variables = {
    id,

    entriesPagination: {
      first: 20000,
    },
  };

  dataProxy.writeQuery<GetExperienceFull, GetExperienceFullVariables>({
    query: GET_EXPERIENCE_FULL_QUERY,

    variables,

    data: {
      getExperience: experience,
    },
  });

  if (writeFragment) {
    writeExperienceFragmentToCache(dataProxy, experience);
  }
}
