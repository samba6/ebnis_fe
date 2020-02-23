import React, { useContext, useEffect, useReducer } from "react";
import { EbnisAppContext } from "../../context";
import { Loading } from "../Loading/loading";
import {
  LayoutContextValue,
  reducer,
  LayoutActionType,
  Props,
  initState,
  StateValue,
  runEffects,
} from "./layout.utils";
import {
  LayoutProvider,
  LayoutUnchangingProvider,
  LayoutExperienceProvider,
  LocationProvider,
} from "./layout-providers";
import { useUser } from "../use-user";
import { WindowLocation, NavigateFn } from "@reach/router";
import {
  EmitActionType,
  EmitActionConnectionChangedPayload,
} from "../../state/observable-manager";
import { cleanupObservableSubscription } from "./layout-injectables";
import { isConnected } from "../../state/connections";

export function Layout(props: Props) {
  const { children } = props;
  const location = props.location as WindowLocation;
  const navigate = props.navigate as NavigateFn;

  const context = useContext(EbnisAppContext);
  const {
    cache,
    restoreCacheOrPurgeStorage,
    client,
    persistor,
    connectionStatus,
    observable,
  } = context;

  const user = useUser();

  const [stateMachine, dispatch] = useReducer(
    reducer,
    { connectionStatus, user },
    initState,
  );

  const {
    states: { prefetchExperiences },
    context: { renderChildren, hasConnection },
    effects: { runOnRenders },
  } = stateMachine;

  useEffect(() => {
    if (runOnRenders.value !== StateValue.hasEffects) {
      return;
    }

    runEffects(runOnRenders.hasEffects.context.effects, context, { dispatch });

    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [runOnRenders]);

  useEffect(() => {
    (async function() {
      if (cache && restoreCacheOrPurgeStorage) {
        try {
          await restoreCacheOrPurgeStorage(persistor);

          /* eslint-disable-next-line no-empty*/
        } catch (error) {}

        dispatch({
          type: LayoutActionType.CACHE_PERSISTED,
          hasConnection: !!isConnected(),
        });
      }
    })();

    const subscription = observable.subscribe({
      next({ type, ...payload }) {
        if (type === EmitActionType.connectionChanged) {
          const {
            hasConnection,
          } = payload as EmitActionConnectionChangedPayload;

          dispatch({
            type: LayoutActionType.CONNECTION_CHANGED,
            isConnected: hasConnection,
          });
        }
      },
    });

    return () => {
      cleanupObservableSubscription(subscription);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  // this will be true if we are server rendering in gatsby build
  if (!(cache && restoreCacheOrPurgeStorage && client)) {
    return (
      <LayoutProvider value={{} as LayoutContextValue}>
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
              hasConnection: hasConnection,
              ...location,
              navigate,
              layoutDispatch: dispatch,
            } as LayoutContextValue
          }
        >
          <LocationProvider value={{ ...location, navigate }}>
            {children}
          </LocationProvider>
        </LayoutProvider>
      </LayoutExperienceProvider>
    </LayoutUnchangingProvider>
  ) : (
    <Loading />
  );
}
