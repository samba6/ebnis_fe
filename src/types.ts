import { PropsWithChildren } from "react";

export interface EbnisComponentProps extends PropsWithChildren<{}> {
  className?: string;
  id?: string;
}

export type IEnum<T extends object> = T[keyof T];
