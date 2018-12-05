import { RouteComponentProps } from "react-router-dom";
import * as Yup from "yup";

import { AppRouteProps } from "../../containers/App/app";
import { ExpDefMutationProps } from "../../graphql/create-exp-def.mutation";
import {
  CreateExpDef as FormValues,
  CreateFieldDef,
  FieldType
} from "../../graphql/apollo-gql.d";

export type OwnProps = AppRouteProps & RouteComponentProps<{}>;

export type Props = OwnProps & ExpDefMutationProps;

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

export interface SelectValue {
  value: string;
}

export const fieldTypes: SelectValue[] = fieldTypeKeys.map(v => ({
  value: v
}));
