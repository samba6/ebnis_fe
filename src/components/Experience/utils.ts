import { RouteComponentProps } from "@reach/router";
import dateFnParse from "date-fns/parse";
import dateFnFormat from "date-fns/format";
import { FieldType } from "../../graphql/apollo-types/globalTypes";

import { GetExperienceGqlProps } from "../../graphql/get-exp.query";
import { GetExpEntriesGqlProps } from "../../graphql/exp-entries.query";
import { WithSideBar } from "../SidebarHeader/sidebar-header";

export interface OwnProps
  extends WithSideBar,
    RouteComponentProps<{
      experienceId: string;
    }> {}

export interface Props
  extends OwnProps,
    GetExperienceGqlProps,
    GetExpEntriesGqlProps {}

export type FormObjVal = Date | string;
export interface FormObj {
  [k: string]: FormObjVal;
}

export interface FieldComponentProps {
  name: string;
  setValue: (formName: string, value: FormObjVal) => void;
}

export const displayFieldType = {
  [FieldType.SINGLE_LINE_TEXT](text: string) {
    return text;
  },

  [FieldType.MULTI_LINE_TEXT](text: string) {
    return text;
  },

  [FieldType.DATE](text: string) {
    const date = dateFnParse(text);

    return dateFnFormat(date, "Do MMM, YYYY");
  },

  [FieldType.DATETIME](text: string) {
    const date = dateFnParse(text);

    return dateFnFormat(date, "Do MMM, YYYY hh:mm A");
  },

  [FieldType.DECIMAL](text: string) {
    return Number(text);
  },

  [FieldType.INTEGER](text: string) {
    return Number(text);
  }
};
