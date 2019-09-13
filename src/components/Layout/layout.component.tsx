import React, { useContext, useEffect, useRef, useReducer } from "react";
import { EbnisAppContext } from "../../context";
import { Loading } from "../Loading/loading";
import {
  ILayoutContextHeaderValue,
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
import {
  LayoutProvider,
  LayoutUnchangingProvider,
  LayoutExperienceProvider,
} from "./layout-providers";
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

  const [stateMachine, dispatch] = useReducer(
    reducer,
    { connectionStatus, user },
    initState,
  );

  const {
    unsavedCount,
    renderChildren,
    hasConnection: hasConnection,
  } = stateMachine.context;

  const {
    states: { prefetchExperiences },
  } = stateMachine;

  useEffect(() => {
    // by now we are done persisting cache so let's see if user has unsaved
    // data
    if (user && renderChildren && unsavedCount === null) {
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

            getUnsavedCount(client).then(newUnsavedCount => {
              dispatch({
                type: LayoutActionType.CONNECTION_CHANGED,
                unsavedCount: newUnsavedCount,
                isConnected,
              });
            });
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
  }, [renderChildren, client, observable, user, unsavedCount]);

  useEffect(
    function persistCacheEffect() {
      if (!(cache && restoreCacheOrPurgeStorage)) {
        return;
      }

      (async function doPersistCache() {
        try {
          await restoreCacheOrPurgeStorage(persistor);
        } catch (error) {}

        dispatch({
          type: LayoutActionType.RENDER_CHILDREN,
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
      <LayoutProvider value={{ unsavedCount: 0 } as ILayoutContextHeaderValue}>
        {children}
      </LayoutProvider>
    );
  }

  return renderChildren ? (
    <LayoutUnchangingProvider value={{ layoutDispatch: dispatch }}>
      <LayoutExperienceProvider
        value={{
          fetchExperience: prefetchExperiences.value,
        }}
      >
        <LayoutProvider
          value={
            {
              unsavedCount,
              hasConnection: hasConnection,
            } as ILayoutContextHeaderValue
          }
        >
          {children}
        </LayoutProvider>
      </LayoutExperienceProvider>
    </LayoutUnchangingProvider>
  ) : (
    <Loading />
  );
}
