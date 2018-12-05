import gql from "graphql-tag";

export const expDefFragment = gql`
  fragment ExpDefFragment on ExpDef {
    id
    title
    description
  }
`;

export default expDefFragment;
