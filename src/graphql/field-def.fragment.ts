import gql from "graphql-tag";

export const FIELD_DEF_FRAGMENT = gql`
  fragment FieldDefFragment on FieldDef {
    id
    name
    type
    clientId
  }
`;
