import React, { useContext, useEffect, useRef, useReducer } from "react";
import { EbnisAppContext } from "../../context";
import { Loading } from "../Loading/loading";
import {
  ILayoutContextContextValue,
  reducer,
  LayoutActionType,
  Props,
  initState,
} from "./layout.utils";
import {
  EmitActionType,
  ConnectionChangedPayload,
} from "../../state/setup-observable";
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
    observable,
  } = useContext(EbnisAppContext);

  const subscriptionRef = useRef<ZenObservable.Subscription | null>(null);
  const user = useUser();

  const [machine, dispatch] = useReducer(
    reducer,
    { connectionStatus, user },
    initState,
  );

  const {
    unsavedCount,
    renderChildren,
    hasConnection: hasConnection,
  } = machine.context;

  const {
    states: { prefetchExperiences },
  } = machine;

  useEffect(() => {
    if (!user) {
      return;
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
      subscriptionRef.current = observable.subscribe({
        next({ type, ...payload }) {
          if (type === EmitActionType.connectionChanged) {
            const {
              hasConnection: isConnected,
            } = payload as ConnectionChangedPayload;

            if (isConnected) {
              getUnsavedCount(client).then(newUnsavedCount => {
                dispatch({
                  type: LayoutActionType.CONNECTION_CHANGED,
                  unsavedCount: newUnsavedCount,
                  isConnected,
                });
              });
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

    return () => {
      // do not unsubscribe when re-rendering i.e between
      // renderChildren === false && renderChildren === true change
      if (subscriptionRef.current && renderChildren) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderChildren]);

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
    [cache, restoreCacheOrPurgeStorage, dispatch, persistor],
  );

  useEffect(() => {
    if (prefetchExperiences.value === "fetch-now") {
      const {
        context: { ids },
      } = prefetchExperiences;
      setTimeout(() => {
        preFetchExperiences({
          ids,
          client,
          cache,
          onDone: () => {
            dispatch({
              type: LayoutActionType.DONE_FETCHING_EXPERIENCES,
            });
          },
        });
      }, 500);
    }
  }, [prefetchExperiences, cache, client]);

  // this will be true if we are server rendering in gatsby build
  if (!(cache && restoreCacheOrPurgeStorage && client)) {
    return (
      <LayoutProvider value={{ unsavedCount: 0 } as ILayoutContextContextValue}>
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
          hasConnection: hasConnection,
        } as ILayoutContextContextValue
      }
    >
      {children}
    </LayoutProvider>
  ) : (
    <Loading />
  );
}
