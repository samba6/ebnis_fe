import { RouteComponentProps } from "react-router-dom";
import * as Yup from "yup";

import { AppRouteProps } from "../../containers/App/app";
import { ExperienceMutationProps } from "../../graphql/create-exp.mutation";
import {
  CreateExperience as FormValues,
  CreateExpField,
  FieldType
} from "../../graphql/apollo-gql.d";

export type OwnProps = AppRouteProps & RouteComponentProps<{}>;

export type Props = OwnProps & ExperienceMutationProps;

const fieldTypeKeys = Object.values(FieldType);

export const ValidationSchema = Yup.object<FormValues>().shape({
  title: Yup.string()
    .required()
    .min(2),
  fields: Yup.array<CreateExpField>()
    .of<CreateExpField>(
      Yup.object<CreateExpField>().shape({
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
