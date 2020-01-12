import { DataProxy } from "apollo-cache";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import {
  EXPERIENCE_FRAGMENT,
  FRAGMENT_NAME_experienceFragment,
} from "../graphql/experience.fragment";
import { entriesPaginationVariables } from "../graphql/get-experience-full.query";
import { makeApolloCacheRef } from "../constants";
import { EXPERIENCE_TYPE_NAME } from "../graphql/types";

export function readExperienceFragment(
  dataProxy: DataProxy,
  experienceId: string,
) {
  const options = {
    id: makeApolloCacheRef(EXPERIENCE_TYPE_NAME, experienceId),
    fragment: EXPERIENCE_FRAGMENT,
    fragmentName: FRAGMENT_NAME_experienceFragment,
    variables: entriesPaginationVariables,
  };

  const experience = dataProxy.readFragment<ExperienceFragment>(options);
  return experience;
}
