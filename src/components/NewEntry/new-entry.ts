import { RouteComponentProps } from "react-router-dom";

import { GetExpGqlProps } from "../../graphql/get-exp.query";
import { NewEntryRouteParams } from "../../routes";
import { CreateEntryGqlProps } from "../../graphql/create-entry.mutation";

export type OwnProps = RouteComponentProps<NewEntryRouteParams>;

export type Props = OwnProps & GetExpGqlProps & CreateEntryGqlProps;

export type FormObjVal = Date | string;
export interface FormObj {
  [k: string]: FormObjVal;
}

export interface FieldComponentProps {
  name: string;
  setValue: (formName: string, value: FormObjVal) => void;
  value: FormObjVal;
}
