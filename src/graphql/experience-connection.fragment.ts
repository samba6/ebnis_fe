import gql from "graphql-tag";
import expFrag from "./exp.fragment";

export const EXPERIENCE_CONNECTION_FRAGMENT = gql`
  fragment ExperienceConnectionFragment on ExperienceConnection {
    pageInfo {
      hasNextPage
      hasPreviousPage
    }

    edges {
      cursor
      node {
        ...ExpFrag
      }
    }
  }

  ${expFrag}
`;
