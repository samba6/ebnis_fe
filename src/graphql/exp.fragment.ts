import gql from "graphql-tag";

export const expFrag = gql`
  fragment ExpFrag on Experience {
    id
    title
    description
  }
`;

export default expFrag;
