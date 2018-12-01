import { RouteComponentProps } from "react-router-dom";
import * as Yup from "yup";

import { AppContextProps } from "../../containers/App/app";
import { ExperienceMutationProps } from "../../graphql/create-exp.mutation";
import {
  CreateExperience as FormValues,
  CreateExpField,
  FieldType
} from "../../graphql/apollo-gql.d";

type OwnProps = AppContextProps & RouteComponentProps<{}>;

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
        type: Yup.mixed().oneOf(fieldTypeKeys)
      })
    )
    .required()
    .min(1)
    .ensure()
});

export const fieldTypes = fieldTypeKeys.map(v => ({
  value: v
}));
