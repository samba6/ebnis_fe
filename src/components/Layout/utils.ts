import { createContext } from "react";
import { CachePersistor } from "apollo-cache-persist";

// tslint:disable-next-line: interface-name
export interface ILayoutContextContext {
  persistor?: CachePersistor<{}>;
  unsavedCount: number;
}

export const LayoutContext = createContext<ILayoutContextContext>({
  unsavedCount: 0,
});
export const LayoutProvider = LayoutContext.Provider;
