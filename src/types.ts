import { PropsWithChildren } from "react";

export interface EbnisComponentProps extends PropsWithChildren<{}> {
  className?: string;
  "data-testid"?: string;
}
