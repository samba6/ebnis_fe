import gql from "graphql-tag";

export const userFragment = gql`
  fragment UserFragment on User {
    id
    name
    email
    jwt
  }
`;

export default userFragment;
