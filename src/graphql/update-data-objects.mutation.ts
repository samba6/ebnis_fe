import gql from "graphql-tag";
import { DATA_OBJECT_FRAGMENT } from "./data-object-fragment";
import { MutationFn } from "react-apollo";
import {
  UpdateDataObjects,
  UpdateDataObjectsVariables,
} from "./apollo-types/UpdateDataObjects";

export const UPDATE_DATA_OBJECTS_ONLINE_MUTATION = gql`
  mutation UpdateDataObjects($input: [UpdateDataObjectInput!]!) {
    updateDataObjects(input: $input) {
      id
      index
      stringError

      dataObject {
        ...DataObjectFragment
      }

      fieldErrors {
        definition
        definitionId
        data
      }
    }
  }

  ${DATA_OBJECT_FRAGMENT}
`;

export type UpdateDataObjectsOnlineMutationFn = MutationFn<
  UpdateDataObjects,
  UpdateDataObjectsVariables
>;

export interface UpdateDataObjectsOnlineMutationProps {
  updateDataObjectsOnline: UpdateDataObjectsOnlineMutationFn;
}
