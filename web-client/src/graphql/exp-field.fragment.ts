import gql from "graphql-tag";

export const expFieldFragment = gql`
  fragment ExpFieldFragment on ExpField {
    id
    name
    singleLineText
    multiLineText
    integer
    decimal
    date
    datetime
    type
  }
`;

export default expFieldFragment;
