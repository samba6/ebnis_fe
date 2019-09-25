import React, {
  DetailedHTMLProps,
  AnchorHTMLAttributes,
  useContext,
} from "react";
import { LocationContext } from "./Layout/layout.utils";

export function Link(props: Props) {
  const { to, ...rest } = props;
  const { navigate } = useContext(LocationContext);
  return (
    <a
      {...rest}
      href={to}
      onClick={e => {
        e.preventDefault();
        navigate(to);
      }}
    />
  );
}

export type Props = DetailedHTMLProps<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & { to: string };
