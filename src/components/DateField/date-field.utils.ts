import { FieldComponentProps } from "../Experience/experience.utils";

export const LABELS = {
  day: "Day",
  month: "Month",
  year: "Year",
};

export interface Props extends FieldComponentProps {
  className?: string;
  value: Date;
}
