import React, { useState } from "react";

import { AppContext } from "./app";

export function AppContextParent(props: React.Props<{}>) {
  const [showSidebar, onShowSidebar] = useState(false);

  return (
    <AppContext.Provider
      value={{
        showSidebar,
        onShowSidebar
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
}

export default AppContextParent;
