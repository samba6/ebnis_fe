import gql from "graphql-tag";

import { fieldDefFrag } from "../../graphql/field-def.fragment";
import { ENTRY_CONNECTION_FRAGMENT } from "../../graphql/entry-connection.fragment";
import { ExperienceAllFieldsFragment } from "../../graphql/apollo-types/ExperienceAllFieldsFragment";

type UnsavedExperienceTypename = "UnsavedExperience";

export const UNSAVED_EXPERIENCE_TYPENAME = "UnsavedExperience" as UnsavedExperienceTypename;

export type UnsavedExperience = Pick<
  ExperienceAllFieldsFragment,
  Exclude<keyof ExperienceAllFieldsFragment, "__typename">
> & {
  __typename: UnsavedExperienceTypename;
};

export const UNSAVED_EXPERIENCE_FRAGMENT_NAME = "UnsavedExperienceFragment";

export const UNSAVED_EXPERIENCE_FRAGMENT = gql`
  fragment UnsavedExperienceFragment on UnsavedExperience {
    id
    title
    description

    fieldDefs {
      ...FieldDefFrag
    }

    entries {
      ...EntryConnectionFragment
    }
  }

  ${fieldDefFrag}
  ${ENTRY_CONNECTION_FRAGMENT}
`;

export const UNSAVED_EXPERIENCES_QUERY = gql`
  query UnsavedExperiencesQuery {
    unsavedExperiences @client {
      ...UnsavedExperienceFragment
    }
  }

  ${UNSAVED_EXPERIENCE_FRAGMENT}
`;

export interface UnsavedExperiencesQueryValues {
  unsavedExperiences: UnsavedExperience[];
}
