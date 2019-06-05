import gql from "graphql-tag";

import { EXPERIENCE_ALL_FIELDS_FRAGMENT } from "./experience-all-fields.fragment";

export const CREATE_EXPERIENCE_RETURN_ALL_FIELDS_MUTATION = gql`
  mutation CreateExperienceReturnAllFieldsMutation($exp: CreateExp!) {
    exp(exp: $exp) {
      ...ExperienceAllFieldsFragment
    }
  }

  ${EXPERIENCE_ALL_FIELDS_FRAGMENT}
`;
