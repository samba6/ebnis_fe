import { createContext, Reducer, Dispatch, PropsWithChildren } from "react";
import { CachePersistor } from "apollo-cache-persist";
import { InMemoryCache } from "apollo-cache-inmemory";
import immer from "immer";
import ApolloClient from "apollo-client";
import { RouteComponentProps } from "@reach/router";
import { wrapReducer } from "../../logger";
import { ConnectionStatus, isConnected } from "../../state/connections";
import { UserFragment } from "../../graphql/apollo-types/UserFragment";

export enum LayoutActionType {
  SET_UNSAVED_COUNT = "@layout/set-unsaved-count",
  RENDER_CHILDREN = "@layout/render-children",
  EXPERIENCES_TO_PREFETCH = "@layout/experiences-to-pre-fetch",
  CONNECTION_CHANGED = "@layout/connection-changed",
  DONE_FETCHING_EXPERIENCES = "@layout/experiences-already-fetched",
}

export const reducer: Reducer<StateMachine, LayoutAction> = (state, action) =>
  wrapReducer(state, action, (prevState, { type, ...payload }) => {
    return immer(prevState, proxy => {
      switch (type) {
        case LayoutActionType.CONNECTION_CHANGED:
          {
            const {
              unsavedCount,
              isConnected,
            } = payload as ConnectionChangedPayload;

            const { context, states } = proxy;
            const yesPrefetch = states.prefetchExperiences as YesPrefechtExperiences;

            context.unsavedCount = unsavedCount;
            context.hasConnection = isConnected;

            if (
              isConnected &&
              states.prefetchExperiences.value === "never-fetched"
            ) {
              if (yesPrefetch.context) {
                yesPrefetch.value = "fetch-now";
              }
            }
          }

          break;

        case LayoutActionType.SET_UNSAVED_COUNT:
          {
            proxy.context.unsavedCount = (payload as { count: number }).count;
          }
          break;

        case LayoutActionType.RENDER_CHILDREN:
          {
            proxy.context.renderChildren = (payload as {
              shouldRender: boolean;
            }).shouldRender;
          }

          break;

        case LayoutActionType.EXPERIENCES_TO_PREFETCH:
          {
            const ids = (payload as {
              ids: string[] | null;
            }).ids;

            const {
              states: { prefetchExperiences },
              context: { user },
            } = proxy;

            if (!user || !ids || ids.length === 0) {
              prefetchExperiences.value = "never-fetched";

              return;
            }

            prefetchExperiences.value = "fetch-now";
            (prefetchExperiences as YesPrefechtExperiences).context = { ids };

            if (!isConnected()) {
              prefetchExperiences.value = "never-fetched";
            }
          }

          break;

        case LayoutActionType.DONE_FETCHING_EXPERIENCES:
          {
            proxy.states.prefetchExperiences.value = "already-fetched";
          }
          break;
      }
    });
  });

export function initState(args: {
  connectionStatus: ConnectionStatus;
  user: UserFragment | null;
}): StateMachine {
  const {
    connectionStatus: { isConnected },
    user,
  } = args;

  return {
    context: {
      unsavedCount: null,
      renderChildren: false,
      hasConnection: isConnected,
      user,
    },
    states: {
      prefetchExperiences: {
        value: "never-fetched",
      },
    },
  };
}

export const LayoutContext = createContext<ILayoutContextContext>({
  unsavedCount: 0,
} as ILayoutContextContext);

////////////////////////// TYPES ////////////////////////////

export type LayoutAction =
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
    }
  | {
      type: LayoutActionType.CONNECTION_CHANGED;
    } & ConnectionChangedPayload
  | {
      type: LayoutActionType.DONE_FETCHING_EXPERIENCES;
    };

interface ConnectionChangedPayload {
  isConnected: boolean;
  unsavedCount: number;
}

export interface StateMachine {
  context: {
    hasConnection: boolean;
    unsavedCount: number | null;
    renderChildren: boolean;
    user: UserFragment | null;
  };

  states: {
    prefetchExperiences:
      | {
          value: "never-fetched";
        }
      | {
          value: "already-fetched";
        }
      | YesPrefechtExperiences;
  };
}

interface YesPrefechtExperiences {
  value: "fetch-now";
  context: {
    ids: string[];
  };
}

export type LayoutDispatchType = Dispatch<LayoutAction>;

export interface Props extends PropsWithChildren<{}>, RouteComponentProps {}

export interface ILayoutContextContext {
  persistor: CachePersistor<{}>;
  unsavedCount: number;
  cache: InMemoryCache;
  layoutDispatch: LayoutDispatchType;
  client: ApolloClient<{}>;
  isConnected: boolean;
}
