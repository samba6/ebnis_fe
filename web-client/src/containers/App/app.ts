import React from "react";

import Header from "../../components/Header";

export enum Route {
  LOGIN = "login",
  HOME = "home"
}

export interface RoutingProps {
  name: Route;
  header?: Header;
}

export interface AppContextProps {
  className: string;
  routeTo: (props: RoutingProps) => void;
}

export const AppContext = React.createContext<AppContextProps>({
  routeTo: () => null,
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
  component: React.LazyExoticComponent<any>;
  mediaQueries: StateMediaQueries;
  header?: React.ComponentClass;
}

export const initialMediaQueries = Object.values(MediaQueryKey).reduce(
  (acc, k) => ({ ...acc, [k]: false }),
  {} as StateMediaQueries
);
