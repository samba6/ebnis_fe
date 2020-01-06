import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import {
  EXPERIENCE_FRAGMENT,
  FRAGMENT_NAME_experienceFragment,
} from "../../graphql/experience.fragment";
import { DataProxy } from "apollo-cache";
import { entriesPaginationVariables } from "../../graphql/get-experience-full.query";

export function writeExperienceFragmentToCache(
  dataProxy: DataProxy,
  experience: ExperienceFragment,
) {
  dataProxy.writeFragment({
    fragment: EXPERIENCE_FRAGMENT,
    fragmentName: FRAGMENT_NAME_experienceFragment,
    id: `Experience:${experience.id}`,
    data: experience,
    variables: entriesPaginationVariables,
  });
}
