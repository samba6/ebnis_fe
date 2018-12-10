import React from "react";

export interface AppContextProps {
  showSidebar: boolean;
  onShowSidebar: (showSidebar: boolean) => void;
  setHeader: React.Dispatch<React.SetStateAction<JSX.Element>>;
  header?: JSX.Element;
}

export const AppContext = React.createContext<AppContextProps>({
  showSidebar: false,
  onShowSidebar: () => null,
  setHeader: () => null
});
