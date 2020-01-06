import { DataProxy } from "apollo-cache";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import {
  EXPERIENCE_FRAGMENT,
  FRAGMENT_NAME_experienceFragment,
} from "../../graphql/experience.fragment";
import { entriesPaginationVariables } from "../../graphql/get-experience-full.query";

export function readExperienceFragmentFromCache(
  dataProxy: DataProxy,
  experienceId: string,
) {
  const options = {
    id: `Experience:${experienceId}`,
    fragment: EXPERIENCE_FRAGMENT,
    fragmentName: FRAGMENT_NAME_experienceFragment,
    variables: entriesPaginationVariables,
  };

  const experience = dataProxy.readFragment<ExperienceFragment>(options);
  return experience;
}
