import { RouteComponentProps } from "@reach/router";

import { GetExperienceGqlProps } from "../../graphql/get-exp.query";
import { NewEntryRouteParams } from "../../routes";
import { CreateEntryGqlProps } from "../../graphql/create-entry.mutation";
import { WithSideBar } from "../SidebarHeader/sidebar-header";

export interface OwnProps
  extends WithSideBar,
    RouteComponentProps<NewEntryRouteParams> {}

export interface Props
  extends OwnProps,
    GetExperienceGqlProps,
    CreateEntryGqlProps {}

export type FormObjVal = Date | string;
export interface FormObj {
  [k: string]: FormObjVal;
}

export interface FieldComponentProps {
  name: string;
  setValue: (formName: string, value: FormObjVal) => void;
  value: FormObjVal;
}
