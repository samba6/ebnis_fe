import React from "react";
import { graphql, StaticQuery } from "gatsby";

import { WithLogo } from "./header";
// import {
//   LogoImageQuery,
//   LogoImageQuery_file_childImageSharp_fixed
// } from "../../graphql/gatsby/types/LogoImageQuery";

export function fetchLogoHOC(Component: React.FunctionComponent<WithLogo>) {
  return function renderComponent(props: {}) {
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
        render={(imageData: any) => {
          const logoAttrs =
            (imageData.file &&
              imageData.file.childImageSharp &&
              imageData.file.childImageSharp.fixed &&
              imageData.file.childImageSharp.fixed) ||
            ({} as any);

          return <Component {...props} logoAttrs={logoAttrs} />;
        }}
      />
    );
  };
}

export default fetchLogoHOC;
