import React, { ComponentType } from "react";
import { graphql, StaticQuery } from "gatsby";

import { WithLogo } from "./header";
import {
  LogoImageQuery,
  LogoImageQuery_file_childImageSharp_fixed
} from "../../graphql/gatsby-types/LogoImageQuery";

export function fetchLogoHOC<TProps>(
  Component: ComponentType<TProps & WithLogo>
) {
  return function renderComponent(props: TProps) {
    return (
      <StaticQuery
        query={graphql`
          query LogoImageQuery {
            file(relativePath: { eq: "logo.png" }) {
              childImageSharp {
                fixed(width: 28, height: 28) {
                  src
                  width
                  height
                }
              }
            }
          }
        `}
        render={(imageData: LogoImageQuery) => {
          const logoAttrs =
            (imageData.file &&
              imageData.file.childImageSharp &&
              imageData.file.childImageSharp.fixed &&
              imageData.file.childImageSharp.fixed) ||
            ({} as LogoImageQuery_file_childImageSharp_fixed);

          return <Component {...props} logoAttrs={logoAttrs} />;
        }}
      />
    );
  };
}
