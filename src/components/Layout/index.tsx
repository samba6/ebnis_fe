import React from "react";

import { useSetupCachePersistor } from "../../context";

export function Layout({ children }: React.PropsWithChildren<{}>) {
  useSetupCachePersistor();

  return <>{children}</>;
}
