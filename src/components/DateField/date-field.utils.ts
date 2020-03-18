import { ReactNode } from "react";
import { FieldComponentProps } from "../Experience/experience.utils";

export interface Props extends FieldComponentProps {
  className?: string;
  value: Date;
}

export interface StateMachine<Value> {
  inputVal: string;
  selectedIndex: number;
  usedOptions: Option<Value>[];
  showingOptions: boolean;
  selectedOption: Option<Value>;
}

export interface Option<Value> {
  value: Value;
  text?: string;
  content?: ReactNode;
}
