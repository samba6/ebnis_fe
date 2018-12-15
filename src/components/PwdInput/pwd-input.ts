import { Dispatch, Reducer } from "react";
import { FieldProps } from "formik";

export interface Props<TFormValues> extends FieldProps<TFormValues> {
  pwdType?: "password" | "text";
  dispatch: Dispatch<Action>;
}

export enum PwdInputActionTypes {
  SET_PWD_TYPE = "@pwd-input/SET_PWD_TYPE"
}

interface Action {
  type: PwdInputActionTypes;
  payload: "password" | "text";
}

export type State = undefined | "password" | "text";

export const reducer: Reducer<State, Action> = (state, action) => {
  return action.payload;
};
