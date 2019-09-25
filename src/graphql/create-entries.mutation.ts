import gql from "graphql-tag";
import { CREATE_ENTRIES_RESPONSE_FRAGMENT } from "./create-entries-response.fragment";

export const CREATE_ENTRIES_MUTATION = gql`
  mutation CreateEntriesMutation($input: [CreateEntriesInput!]!) {
    createEntries(input: $input) {
      ...CreateEntriesResponseFragment
    }
  }

  ${CREATE_ENTRIES_RESPONSE_FRAGMENT}
`;

