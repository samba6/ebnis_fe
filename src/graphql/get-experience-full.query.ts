import gql from "graphql-tag";
import { EXPERIENCE_FRAGMENT } from "./experience.fragment";
import {
  GetExperienceFullVariables,
  GetExperienceFull,
} from "./apollo-types/GetExperienceFull";
import { QueryResult } from "@apollo/react-common";

export const GET_EXPERIENCE_FULL_QUERY = gql`
  query GetExperienceFull($id: ID!, $entriesPagination: PaginationInput!) {
    getExperience(id: $id) {
      ...ExperienceFragment
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;

export type GetExperienceFullQueryResult = QueryResult<
  GetExperienceFull,
  GetExperienceFullVariables
>;

export const QUERY_NAME_getExperienceFull = "getExperience";

export const entriesPaginationVariables = {
  entriesPagination: {
    first: 20000,
  },
};
