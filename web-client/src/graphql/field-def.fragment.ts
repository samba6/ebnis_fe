import gql from "graphql-tag";

export const fieldDefFragment = gql`
  fragment FieldDefFragment on FieldDef {
    id
    name
    type
  }
`;

export default fieldDefFragment;
