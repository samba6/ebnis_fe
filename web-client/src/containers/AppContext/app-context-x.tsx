import React, { useState } from "react";

import { AppContext } from "./app-context";
import Header from "../../components/Header";

export function AppContextParent(props: React.Props<{}>) {
  const [header, setHeader] = useState(<Header title="Ebnis" />);
  const [showSidebar, onShowSidebar] = useState(false);

  return (
    <AppContext.Provider
      value={{
        showSidebar,
        onShowSidebar,
        setHeader,
        header
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
}

export default AppContextParent;
