import { createContext, Reducer, Dispatch, PropsWithChildren } from "react";
import { CachePersistor } from "apollo-cache-persist";
import { InMemoryCache } from "apollo-cache-inmemory";
import immer from "immer";
import ApolloClient from "apollo-client";
import { RouteComponentProps } from "@reach/router";

export interface ILayoutContextContext {
  persistor: CachePersistor<{}>;
  unsavedCount: number;
  cache: InMemoryCache;
  layoutDispatch: LayoutDispatchType;
  client: ApolloClient<{}>;
}

export const LayoutContext = createContext<ILayoutContextContext>({
  unsavedCount: 0,
} as ILayoutContextContext);

export enum LayoutActionType {
  SET_UNSAVED_COUNT = "@layout/set-unsaved-count",
  RENDER_CHILDREN = "@layout/render-children",
  EXPERIENCES_TO_PREFETCH = "@layout/experiences-to-pre-fetch",
}

type Action =
  | {
      type: LayoutActionType.SET_UNSAVED_COUNT;
      count: number;
    }
  | {
      type: LayoutActionType.RENDER_CHILDREN;
      shouldRender: boolean;
    }
  | {
      type: LayoutActionType.EXPERIENCES_TO_PREFETCH;
      ids: string[] | null;
    };

interface State {
  unsavedCount: number | null;
  renderChildren: boolean;
  experiencesToPreFetch?: string[] | null;
}

export const reducer: Reducer<State, Action> = (
  prevState,
  { type, ...payload },
) => {
  return immer(prevState, proxy => {
    switch (type) {
      case LayoutActionType.SET_UNSAVED_COUNT:
        {
          proxy.unsavedCount = (payload as { count: number }).count;
        }

        break;

      case LayoutActionType.RENDER_CHILDREN:
        {
          proxy.renderChildren = (payload as {
            shouldRender: boolean;
          }).shouldRender;
        }

        break;

      // istanbul ignore next:tested in MyExperiences component
      case LayoutActionType.EXPERIENCES_TO_PREFETCH:
        {
          proxy.experiencesToPreFetch = (payload as {
            ids: string[] | null;
          }).ids;
        }

        break;
    }
  });
};

export type LayoutDispatchType = Dispatch<Action>;

export interface Props extends PropsWithChildren<{}>, RouteComponentProps {}
