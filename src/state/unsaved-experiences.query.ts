import gql from "graphql-tag";

import { EXPERIENCE_ALL_FIELDS_FRAGMENT } from "../graphql/experience-all-fields.fragment";
import { ExperienceAllFieldsFragment } from "../graphql/apollo-types/ExperienceAllFieldsFragment";

export const UNSAVED_EXPERIENCES_QUERY = gql`
  query UnsavedExperiencesQuery {
    unsavedExperiences @client {
      ...ExperienceAllFieldsFragment
    }
  }

  ${EXPERIENCE_ALL_FIELDS_FRAGMENT}
`;

export interface UnsavedExperiencesQueryValues {
  unsavedExperiences: ExperienceAllFieldsFragment[];
}
