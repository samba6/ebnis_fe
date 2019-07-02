import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { EXPERIENCE_FRAGMENT } from "../../graphql/experience.fragment";
import { DataProxy } from "apollo-cache";

export function writeExperienceFragmentToCache(
  dataProxy: DataProxy,
  experience: ExperienceFragment,
) {
  dataProxy.writeFragment({
    fragment: EXPERIENCE_FRAGMENT,
    fragmentName: "ExperienceFragment",
    id: `Experience:${experience.id}`,
    data: experience,
  });
}
