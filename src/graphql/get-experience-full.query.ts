import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { EXPERIENCE_FRAGMENT } from "./experience.fragment";
import {
  GetExperienceFull,
  GetExperienceFullVariables
} from "./apollo-types/GetExperienceFull";

export const GET_EXPERIENCE_FULL_QUERY = gql`
  query GetExperienceFull($id: ID!, $entriesPagination: PaginationInput) {
    getExperience(id: $id) {
      ...ExperienceFragment
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export type GetExperienceFullData = DataValue<
  GetExperienceFull,
  GetExperienceFullVariables
>;

export interface GetExperienceFullProps {
  getExperienceGql?: GetExperienceFullData;
}
