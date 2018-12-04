import React from "react";

export interface AppContextProps {
  showSidebar: boolean;
  onShowSidebar: (showSidebar: boolean) => void;
}

export const AppContext = React.createContext<AppContextProps>({
  showSidebar: false,
  onShowSidebar: () => null
});

export interface AppRouteProps {
  setHeader: React.Dispatch<React.SetStateAction<JSX.Element>>;
  reInitSocket: (jwt: string) => void;
}

export enum MediaQueryKey {
  SCREEN_MIN_WIDTH_600 = "screenMinWidth600"
}

export const mediaQueries = {
  [MediaQueryKey.SCREEN_MIN_WIDTH_600]: "screen and (min-width: 600px)"
};

type StateMediaQueries = { [k in MediaQueryKey]: boolean };

export interface State {
  header?: JSX.Element;
  cacheLoaded?: boolean;
  showSidebar?: boolean;
}

export const initialMediaQueries: StateMediaQueries = Object.values(
  MediaQueryKey
).reduce((acc, k) => ({ ...acc, [k]: false }), {} as StateMediaQueries);
