import gql from "graphql-tag";

export const fieldDefFrag = gql`
  fragment FieldDefFrag on FieldDef {
    id
    name
    type
  }
`;

export default fieldDefFrag;
