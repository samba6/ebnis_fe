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

    return () => {
      (subscriptionRef.current as ZenObservable.Subscription).unsubscribe();
    };
  }, [client, observable]);

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
          type: LayoutActionType.CACHE_PERSISTED,
          unsavedCount: await getUnsavedCount(client),
          hasConnection: !!isConnected(),
        });
      })();
    },
    [restoreCacheOrPurgeStorage, dispatch, persistor, client],
  );

  useEffect(() => {
    if (prefetchExperiences.value !== "fetch-now") {
      return;
    }

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
  }, [prefetchExperiences, cache, client]);

  // this will be true if we are server rendering in gatsby build
  if (!(cache && restoreCacheOrPurgeStorage && client)) {
    return (
      <LayoutProvider value={{ unsavedCount: 0 } as ILayoutContextHeaderValue}>
        {children}
      </LayoutProvider>
    );
  }

  // console.log(JSON.stringify(stateMachine, null, 2));

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
