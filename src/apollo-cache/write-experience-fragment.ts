/* istanbul ignore file */
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import {
  EXPERIENCE_FRAGMENT,
  FRAGMENT_NAME_experienceFragment,
} from "../graphql/experience.fragment";
import { DataProxy } from "apollo-cache";
import { entriesPaginationVariables } from "../graphql/get-experience-full.query";
import { makeApolloCacheRef } from "../constants";
import { EXPERIENCE_TYPE_NAME } from "../graphql/types";

export function writeExperienceFragmentToCache(
  dataProxy: DataProxy,
  experience: ExperienceFragment,
) {
  const { id } = experience;

  dataProxy.writeFragment({
    fragment: EXPERIENCE_FRAGMENT,
    fragmentName: FRAGMENT_NAME_experienceFragment,
    id: makeApolloCacheRef(EXPERIENCE_TYPE_NAME, id),
    data: experience,
    variables: entriesPaginationVariables,
  });
}
