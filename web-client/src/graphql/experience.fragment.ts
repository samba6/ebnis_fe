import gql from "graphql-tag";

export const experienceFragment = gql`
  fragment ExperienceFragment on Experience {
    id
    title
    description
  }
`;

export default experienceFragment;
