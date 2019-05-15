import { SetStateAction } from "react";
import { RouteComponentProps } from "@reach/router";

import { LogoImageQuery_file_childImageSharp_fixed } from "../../graphql/gatsby-types/LogoImageQuery";
import { WithUser } from "../with-user-hoc";

export interface OwnProps {
  title: string;
  wide?: boolean;
  sidebar?: boolean;
  show?: boolean;
  toggleShowSidebar?: React.Dispatch<SetStateAction<boolean>>;
}

export interface Props
  extends WithLogo,
    OwnProps,
    WithUser,
    RouteComponentProps {}

export interface WithLogo {
  logoAttrs: LogoImageQuery_file_childImageSharp_fixed;
}
