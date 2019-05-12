import React, { ComponentType } from "react";

import { UserFragment } from "../graphql/apollo-types/UserFragment";
import { getUser } from "../state/tokens";

export interface WithUser {
  user?: UserFragment | null;
}

export function withUserHOC<TProps extends WithUser>(
  Component: ComponentType<TProps>
) {
  return function HOC(props: TProps) {
    return <Component user={getUser()} {...props} />;
  };
}
