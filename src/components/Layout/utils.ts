import { createContext } from "react";
import { CachePersistor } from "apollo-cache-persist";

interface Context {
  persistor?: CachePersistor<{}>;
}

export const LayoutContext = createContext<Context>({});
export const LayoutProvider = LayoutContext.Provider;
