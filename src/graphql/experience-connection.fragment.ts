import gql from "graphql-tag";
import { EXPERIENCE_FRAGMENT } from "./experience.fragment";

export const EXPERIENCE_CONNECTION_FRAGMENT = gql`
  fragment ExperienceConnectionFragment on ExperienceConnection {
    pageInfo {
      hasNextPage
      hasPreviousPage
    }

    edges {
      cursor
      node {
        ...ExperienceFragment
      }
    }
  }

  ${EXPERIENCE_FRAGMENT}
`;
