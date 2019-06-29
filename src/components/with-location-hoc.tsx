import React, { ComponentType } from "react";
import { Location, RouteComponentProps } from "@reach/router";

export function withLocationHOC<TProps extends RouteComponentProps>(
  Component: ComponentType<TProps>,
) {
  return function HOC(props: TProps) {
    return (
      <Location>
        {locationProps => <Component {...locationProps} {...props} />}
      </Location>
    );
  };
}
