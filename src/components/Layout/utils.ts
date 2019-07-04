import { createContext, Reducer, Dispatch } from "react";
import { CachePersistor } from "apollo-cache-persist";
import { InMemoryCache } from "apollo-cache-inmemory";
import immer from "immer";
import ApolloClient from "apollo-client";

export interface ILayoutContextContext {
  persistor: CachePersistor<{}>;
  unsavedCount: number;
  cache: InMemoryCache;
  layoutDispatch: LayoutDispatchType;
  client: ApolloClient<{}>;
  experiencesPreFetched?: boolean;
}

export const LayoutContext = createContext<ILayoutContextContext>({
  unsavedCount: 0,
} as ILayoutContextContext);

export enum LayoutActionType {
  setUnsavedCount = "@components/layout/set-unsaved-count",
  shouldRenderChildren = "@components/layout/should-render-children",
  setExperiencesPreFetched = "@components/layout/set-experiences-are-pre-fetched",
}

type Action =
  | [LayoutActionType.setUnsavedCount, number]
  | [LayoutActionType.shouldRenderChildren, boolean]
  | [LayoutActionType.setExperiencesPreFetched, boolean];

interface State {
  unsavedCount: number;
  renderChildren: boolean;
  experiencesPreFetched?: boolean;
}

export const reducer: Reducer<State, Action> = (prevState, [type, payload]) => {
  return immer(prevState, proxy => {
    switch (type) {
      case LayoutActionType.setUnsavedCount:
        {
          proxy.unsavedCount = payload as number;
        }

        break;

      case LayoutActionType.shouldRenderChildren:
        {
          proxy.renderChildren = payload as boolean;
        }

        break;

      case LayoutActionType.setExperiencesPreFetched:
        {
          proxy.experiencesPreFetched = payload as boolean;
        }

        break;
    }
  });
};

export type LayoutDispatchType = Dispatch<Action>;
