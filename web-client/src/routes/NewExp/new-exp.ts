import { RouteComponentProps } from "react-router-dom";
import * as Yup from "yup";
import { DropdownItemProps } from "semantic-ui-react";

import { AppRouteProps } from "../../containers/App/app";
import { CreateExpMutationProps } from "../../graphql/create-exp.mutation";
import {
  CreateExp as FormValues,
  CreateFieldDef,
  FieldType
} from "../../graphql/apollo-gql.d";

export type OwnProps = AppRouteProps & RouteComponentProps<{}>;

export type Props = OwnProps & CreateExpMutationProps;

const fieldTypeKeys = Object.values(FieldType);

export const ValidationSchema = Yup.object<FormValues>().shape({
  title: Yup.string()
    .required()
    .min(2),
  fieldDefs: Yup.array<CreateFieldDef>()
    .of<CreateFieldDef>(
      Yup.object<CreateFieldDef>().shape({
        name: Yup.string()
          .required()
          .min(2),
        type: Yup.mixed().oneOf(
          fieldTypeKeys,
          "${path} please select from dropdown"
        )
      })
    )
    .required()
    .min(1)
    .ensure()
});

export const FIELD_TYPES: DropdownItemProps[] = [];

for (const k of fieldTypeKeys) {
  FIELD_TYPES.push({
    value: k,
    text: k,
    key: k
  });
}
