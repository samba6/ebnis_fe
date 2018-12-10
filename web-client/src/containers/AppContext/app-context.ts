import React from "react";

export interface AppContextProps {
  showSidebar: boolean;
  onShowSidebar: (showSidebar: boolean) => void;
}

export const AppContext = React.createContext<AppContextProps>({
  showSidebar: false,
  onShowSidebar: () => null
});
