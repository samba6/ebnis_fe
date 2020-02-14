import gql from "graphql-tag";

export const DELETE_EXPERIENCES_MUTATION = gql`
  mutation DeleteExperiencesMutation($input: [ID!]!) {
    deleteExperiences(input: $input) {
      __typename
    }
  }
`;
