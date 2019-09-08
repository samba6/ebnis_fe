import React, { useContext, useEffect, useRef, useReducer } from "react";
import { EbnisAppContext } from "../../context";
import { Loading } from "../Loading/loading";
import {
  ILayoutContextContext,
  reducer,
  LayoutActionType,
  Props,
  initState,
} from "./layout.utils";
import { getObservable, EmitAction } from "../../setup-observable";
import { ZenObservable } from "zen-observable-ts";
import { getUnsavedCount } from "../../state/unsaved-resolvers";
import { LayoutProvider } from "./layout-provider";
import { preFetchExperiences } from "./pre-fetch-experiences";
import { useUser } from "../use-user";
import { isConnected } from "../../state/connections";

export function Layout(props: Props) {
  const { children } = props;

  const {
    cache,
    restoreCacheOrPurgeStorage,
    client,
    persistor,
    connectionStatus,
  } = useContext(EbnisAppContext);

  const subscriptionRef = useRef<ZenObservable.Subscription | null>(null);

  const [state, dispatch] = useReducer(
    reducer,
    { connectionStatus },
    initState,
  );

  const user = useUser();

  const { unsavedCount, renderChildren, experiencesToPreFetch } = state;

  useEffect(() => {
    if (!(cache && restoreCacheOrPurgeStorage && client)) {
      return;
    }

    if (user) {
      if (experiencesToPreFetch) {
        setTimeout(async () => {
          if (await isConnected()) {
            preFetchExperiences({
              ids: experiencesToPreFetch,
              client,
              cache,
              onDone: () => {
                dispatch({
                  type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
                  ids: experiencesToPreFetch,
                });
              },
            });
          }
        });
      }

      // by now we are done persisting cache so let's see if user has unsaved
      // data
      if (renderChildren && unsavedCount === null) {
        (async function() {
          if (await isConnected()) {
            const newUnsavedCount = await getUnsavedCount(client);
            dispatch({
              type: LayoutActionType.SET_UNSAVED_COUNT,
              count: newUnsavedCount,
            });
          }
        })();
      }

      if (!subscriptionRef.current) {
        subscriptionRef.current = getObservable().subscribe({
          next([type, data]) {
            if (type === EmitAction.connectionChanged) {
              const isConnected = data as boolean;

              if (isConnected) {
                getUnsavedCount(client).then(newUnsavedCount => {
                  dispatch({
                    type: LayoutActionType.CONNECTION_CHANGED,
                    unsavedCount: newUnsavedCount,
                    isConnected,
                  });
                });

                if (experiencesToPreFetch) {
                  setTimeout(() => {
                    preFetchExperiences({
                      ids: experiencesToPreFetch,
                      client,
                      cache,
                      onDone: () => {
                        dispatch({
                          type: LayoutActionType.EXPERIENCES_TO_PREFETCH,
                          ids: null,
                        });
                      },
                    });
                  }, 500);
                }
              } else {
                // if we are disconnected, then we don't display unsaved UI
                dispatch({
                  type: LayoutActionType.CONNECTION_CHANGED,
                  unsavedCount: 0,
                  isConnected,
                });
              }
            }
          },
        });
      }
    }

    return () => {
      // do not unsubscribe when re-rendering i.e between
      // renderChildren === false && renderChildren === true change
      if (subscriptionRef.current && renderChildren) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderChildren, experiencesToPreFetch]);

  useEffect(
    function PersistCache() {
      if (!(cache && restoreCacheOrPurgeStorage)) {
        return;
      }

      (async function doPersistCache() {
        try {
          await restoreCacheOrPurgeStorage(persistor);
        } catch (error) {}

        dispatch({
          type: LayoutActionType.RENDER_CHILDREN,
          shouldRender: true,
        });
      })();
    },
    [cache, restoreCacheOrPurgeStorage, dispatch],
  );

  // this will be true if we are server rendering in gatsby build
  if (!(cache && restoreCacheOrPurgeStorage && client)) {
    return (
      <LayoutProvider value={{ unsavedCount: 0 } as ILayoutContextContext}>
        {children}
      </LayoutProvider>
    );
  }

  return renderChildren ? (
    <LayoutProvider
      value={
        {
          persistor,
          unsavedCount,
          cache,
          layoutDispatch: dispatch,
          client,
          isConnected: state.connection.value === "connected",
        } as ILayoutContextContext
      }
    >
      {children}
    </LayoutProvider>
  ) : (
    <Loading />
  );
}
