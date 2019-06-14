import gql from "graphql-tag";
import { DataValue } from "react-apollo";
import { EXPERIENCE_FRAGMENT } from "./experience.fragment";
import { GetAnExp, GetAnExpVariables } from "./apollo-types/GetAnExp";

export const GET_EXP_QUERY = gql`
  query GetAnExp($exp: GetExp!, $pagination: PaginationInput!) {
    exp(exp: $exp) {
      ...ExperienceFragment
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export type GetExperienceGqlValues = DataValue<GetAnExp, GetAnExpVariables>;

export interface GetExperienceGqlProps {
  getExperienceGql?: GetExperienceGqlValues;
}
