import { SetStateAction } from "react";

import { LogoImageQuery_file_childImageSharp_fixed } from "../../graphql/gatsby-types/LogoImageQuery";

export interface OwnProps {
  title: string;
  wide?: boolean;
  sidebar?: boolean;
  show?: boolean;
  toggleShowSidebar?: React.Dispatch<SetStateAction<boolean>>;
}

export interface Props extends WithLogo, OwnProps {}

export interface WithLogo {
  logoAttrs: LogoImageQuery_file_childImageSharp_fixed;
}
