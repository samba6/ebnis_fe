import { RouteComponentProps } from "@reach/router";
import dateFnParse from "date-fns/parse";
import dateFnFormat from "date-fns/format";
import { FieldType } from "../../graphql/apollo-types/globalTypes";
import { NewEntryRouteParams } from "../../routes";
import { GetAnExp_exp } from "../../graphql/apollo-types/GetAnExp";

export interface Props extends RouteComponentProps<NewEntryRouteParams> {
  experience: GetAnExp_exp;
}

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

    return dateFnFormat(date, "DD/MM/YYYY");
  },

  [FieldType.DATETIME](text: string) {
    const date = dateFnParse(text);

    return formatDatetime(date);
  },

  [FieldType.DECIMAL](text: string) {
    return Number(text);
  },

  [FieldType.INTEGER](text: string) {
    return Number(text);
  }
};

export function formatDatetime(date: string | Date) {
  return dateFnFormat(date, "DD/MM/YYYY HH:mm:ss");
}
