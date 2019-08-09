import gql from "graphql-tag";
import { DATA_DEFINITION_FRAGMENT } from "./data-definition.fragment";
import { ENTRY_CONNECTION_FRAGMENT } from "./entry-connection.fragment";

// the minimum fields needed to quickly display an experience
export const EXPERIENCE_MINI_FRAGMENT = gql`
  fragment ExperienceMiniFragment on Experience {
    id
    title
    description
    clientId
    insertedAt
    updatedAt
    hasUnsaved
  }
`;

// the fields not in mini fragment.
export const EXPERIENCE_REST_FRAGMENT = gql`
  fragment ExperienceRestFragment on Experience {
    id
    dataDefinitions {
      ...DataDefinitionFragment
    }

    entries(pagination: $entriesPagination) {
      ...EntryConnectionFragment
    }
  }

  ${DATA_DEFINITION_FRAGMENT}
  ${ENTRY_CONNECTION_FRAGMENT}
`;

export const EXPERIENCE_FRAGMENT = gql`
  fragment ExperienceFragment on Experience {
    ...ExperienceMiniFragment

    dataDefinitions {
      ...DataDefinitionFragment
    }

    entries(pagination: $entriesPagination) {
      ...EntryConnectionFragment
    }
  }

  ${EXPERIENCE_MINI_FRAGMENT}
  ${DATA_DEFINITION_FRAGMENT}
  ${ENTRY_CONNECTION_FRAGMENT}
`;

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

export const EXPERIENCE_CONNECTION_PRE_FETCH_FRAGMENT = gql`
  fragment ExperienceConnectionPreFetchFragment on ExperienceConnection {
    edges {
      cursor
      node {
        ...ExperienceRestFragment
      }
    }
  }

  ${EXPERIENCE_REST_FRAGMENT}
`;

export const EXPERIENCE_NO_ENTRY_FRAGMENT = gql`
  fragment ExperienceNoEntryFragment on Experience {
    ...ExperienceMiniFragment

    dataDefinitions {
      ...DataDefinitionFragment
    }
  }

  ${EXPERIENCE_MINI_FRAGMENT}
  ${DATA_DEFINITION_FRAGMENT}
`;
