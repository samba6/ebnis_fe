import gql from "graphql-tag";
import { graphql } from "react-apollo";

import { EXPERIENCE_ALL_FIELDS_FRAGMENT } from "../../graphql/experience-all-fields.fragment";
import { ExperienceAllFieldsFragment } from "../../graphql/apollo-types/ExperienceAllFieldsFragment";
import expFrag from "../../graphql/exp.fragment";
import { GetExps_exps } from "../../graphql/apollo-types/GetExps";
import { EXPERIENCE_CONNECTION_FRAGMENT } from "../../graphql/experience-connection.fragment";

export const UNSAVED_EXPERIENCES_QUERY = gql`
  query UnsavedExperiencesQuery {
    unsavedExperiences @client {
      ...ExperienceAllFieldsFragment
    }
  }

  ${EXPERIENCE_ALL_FIELDS_FRAGMENT}
`;

export interface UnsavedExperiencesQueryProps {
  unsavedExperiences: ExperienceAllFieldsFragment[];
}

export const unsavedExperiencesGql = graphql<
  {},
  UnsavedExperiencesQueryProps,
  {},
  UnsavedExperiencesQueryProps | undefined
>(UNSAVED_EXPERIENCES_QUERY, {
  props: ({ data }) =>
    data && {
      unsavedExperiences: data.unsavedExperiences || []
    }
});

//////////////////////////////////////////////////

export const EXPERIENCES_OFFLINE_QUERY = gql`
  query ExperiencesOfflineQuery($pagination: PaginationInput!) {
    experiencesOffline(pagination: $pagination) @client {
      ...ExperienceConnectionFragment
    }
  }

  ${EXPERIENCE_CONNECTION_FRAGMENT}
`;

export interface ExperiencesOfflineQueryReturned {
  experiencesOffline: GetExps_exps[];
}
