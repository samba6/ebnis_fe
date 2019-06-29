import { FieldComponentProps } from "../Experience/utils";

type DropdownOptions = Array<{
  key: number;
  text: string;
  value: number;
}>;

export const HOUR_OPTIONS: DropdownOptions = [];

for (let hrIndex = 0; hrIndex < 24; hrIndex++) {
  HOUR_OPTIONS.push({
    key: hrIndex,
    text: ("" + hrIndex).padStart(2, "0"),
    value: hrIndex,
  });
}

export const MINUTE_OPTIONS: DropdownOptions = [];

for (let minIndex = 0; minIndex < 60; minIndex++) {
  MINUTE_OPTIONS.push({
    key: minIndex,
    text: ("" + minIndex).padStart(2, "0"),
    value: minIndex,
  });
}

export const LABELS = ["date", "hr", "min"];

export function getFieldName(compName: string, field: string) {
  return compName + "." + field;
}

export interface Props extends FieldComponentProps {
  className?: string;
  value: Date;
}
