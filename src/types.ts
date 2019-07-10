import { PropsWithChildren } from "react";

export interface EbnisComponentProps extends PropsWithChildren<{}> {
  className?: string;
  "data-testid"?: string;
}

export type IEnum<T extends object> = T[keyof T];
