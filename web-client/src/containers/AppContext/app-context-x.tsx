import React, { useState } from "react";

import { AppContext } from "./app-context";
import Header from "../../components/Header";
import { getSocket } from "../../socket";
import { makeClient } from "./set-up";

let client = makeClient();

export function AppContextParent(props: React.Props<{}>) {
  const [header, setHeader] = useState(<Header title="Ebnis" />);
  const [showSidebar, onShowSidebar] = useState(false);

  return (
    <AppContext.Provider
      value={{
        showSidebar,
        onShowSidebar,
        setHeader,
        header,
        reInitSocket,
        client
      }}
    >
      {props.children}
    </AppContext.Provider>
  );
}

export default AppContextParent;

function reInitSocket(jwt: string) {
  const socket = getSocket().ebnisConnect(jwt);
  client = makeClient(socket, true);
}
