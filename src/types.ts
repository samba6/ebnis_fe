/* eslint-disable @typescript-eslint/no-explicit-any*/
import { PropsWithChildren } from "react";

export type EbnisComponentProps = any &
  PropsWithChildren<{}> & {
    className?: string;
    id?: string;
    value?: any;
    onChange?: any;
    name?: string;
  };

export type IEnum<T extends object> = T[keyof T];
