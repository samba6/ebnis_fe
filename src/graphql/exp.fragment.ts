import gql from "graphql-tag";

export const expFrag = gql`
  fragment ExpFrag on Experience {
    id
    title
    description
    clientId
  }
`;

export default expFrag;
