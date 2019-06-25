import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { EXPERIENCE_FRAGMENT } from "./experience.fragment";
import {
  GetExperienceFull,
  GetExperienceFullVariables
} from "./apollo-types/GetExperienceFull";

export const GET_EXP_QUERY = gql`
  query GetExperienceFull($exp: GetExp!, $entriesPagination: PaginationInput) {
    exp(exp: $exp) {
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
