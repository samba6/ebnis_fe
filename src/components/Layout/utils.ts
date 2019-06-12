import { createContext } from "react";
import { CachePersistor } from "apollo-cache-persist";

interface Context {
  persistor: null | CachePersistor<{}>;
}

export const LayoutContext = createContext<Context>({ persistor: null });
export const LayoutProvider = LayoutContext.Provider;
