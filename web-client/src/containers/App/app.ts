import React from "react";

export enum Route {
  LOGIN = "login",
  HOME = "home",
  SIGN_UP = "sign-up"
}

export interface RoutingRoute {
  documentTitle: string;
}

export const defaultRt: RoutingRoute = {
  documentTitle: "Ebnis"
};

export interface RoutingProps {
  name: Route;
}

export interface AppContextProps {
  className: string;
  routeTo: (props: RoutingProps) => void;
  setHeader?: (header: JSX.Element) => void;
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
  router?: {
    component: React.LazyExoticComponent<any>;
    rt: RoutingRoute;
  };
  mediaQueries: StateMediaQueries;
  header?: React.ComponentClass;
  cacheLoaded?: boolean;
}

export const initialMediaQueries = Object.values(MediaQueryKey).reduce(
  (acc, k) => ({ ...acc, [k]: false }),
  {} as StateMediaQueries
);

let titleEl = document.getElementById("ebnis-title");

export const setTitle = (title?: string) => {
  if (!titleEl) {
    titleEl = document.getElementById("ebnis-title");
  }

  if (titleEl) {
    titleEl.innerText = title ? `Ebnis | ${title}` : "Ebnis";
  }
};
