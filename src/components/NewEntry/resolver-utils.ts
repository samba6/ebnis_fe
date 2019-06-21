import { EXPERIENCE_FRAGMENT } from "../../graphql/experience.fragment";
import gql from "graphql-tag";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";

export const GET_UNSAVED_ENTRIES_SAVED_EXPERIENCES_QUERY = gql`
  query {
    unsavedEntriesSavedExperiences @client {
      ...ExperienceFragment
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export interface UnsavedEntriesSavedExperiencesQueryReturned {
  unsavedEntriesSavedExperiences: ExperienceFragment[];
}
