import { EXPERIENCE_FRAGMENT } from "../../graphql/experience.fragment";
import gql from "graphql-tag";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";

export const GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY = gql`
  query {
    savedExperiencesUnsavedEntries @client {
      ...ExperienceFragment
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export interface SavedExperiencesUnsavedEntriesQueryReturned {
  savedExperiencesUnsavedEntries: ExperienceFragment[];
}
