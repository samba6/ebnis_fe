import React from "react";

export interface AppContextProps {
  className: string;
  setHeader?: (header: JSX.Element) => void;
}

export const AppContext = React.createContext<AppContextProps>({
  className: ""
});

export const AppConsumer = AppContext.Consumer;
export const AppProvider = AppContext.Provider;

export enum MediaQueryKey {
  SCREEN_MIN_WIDTH_600 = "screenMinWidth600"
}

export const mediaQueries = {
  [MediaQueryKey.SCREEN_MIN_WIDTH_600]: "screen and (min-width: 600px)"
};

type StateMediaQueries = { [k in MediaQueryKey]: boolean };

export interface State {
  mediaQueries: StateMediaQueries;
  header?: React.ComponentClass;
  cacheLoaded?: boolean;
}

export const initialMediaQueries: StateMediaQueries = Object.values(
  MediaQueryKey
).reduce((acc, k) => ({ ...acc, [k]: false }), {} as StateMediaQueries);
