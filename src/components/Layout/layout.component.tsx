import React, {
  useContext,
  useEffect,
  useRef,
  useReducer,
  useLayoutEffect,
} from "react";
import { EbnisAppContext } from "../../context";
import { Loading } from "../Loading/loading";
import {
  ILayoutContextHeaderValue,
  reducer,
  LayoutActionType,
  Props,
  initState,
  StateValue,
  EffectFunctionsArgs,
  effectFunctions,
} from "./layout.utils";
import {
  EmitActionType,
  ConnectionChangedPayload,
} from "../../state/observable-manager";
import { ZenObservable } from "zen-observable-ts";
import { getOfflineItemsCount } from "../../state/offline-resolvers";
import {
  LayoutProvider,
  LayoutUnchangingProvider,
  LayoutExperienceProvider,
  LocationProvider,
} from "./layout-providers";
import { preFetchExperiences } from "./pre-fetch-experiences";
import { useUser } from "../use-user";
import { isConnected } from "../../state/connections";
import { WindowLocation, NavigateFn } from "@reach/router";

export function Layout(props: Props) {
  const { children } = props;
  const location = props.location as WindowLocation;
  const navigate = props.navigate as NavigateFn;

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
    states: { prefetchExperiences },
    context: {
      offlineItemsCount,
      renderChildren,
      hasConnection: hasConnection,
    },
    effects,
  } = stateMachine;

  useEffect(() => {
    if (effects.value === StateValue.effectValHasEffects) {
      const {
        context: { metaFunctions },
        hasEffects: { context },
      } = effects;

      for (const { key, ownArgs, effectArgKeys } of context.effects) {
        const effectArgKeys1 = effectArgKeys as (keyof EffectFunctionsArgs)[];
        const args = effectArgKeys1.reduce(
          (acc, k) => {
            acc[k] = metaFunctions[k];
            return acc;
          },
          {} as EffectFunctionsArgs,
        );

        effectFunctions[key](args, ownArgs);
      }
    }
  }, [effects]);

  useLayoutEffect(() => {
    dispatch({
      type: LayoutActionType.PUT_EFFECT_FUNCTIONS_ARGS,
      cache,
      dispatch,
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  useEffect(() => {
    subscriptionRef.current = observable.subscribe({
      next({ type, ...payload }) {
        if (type === EmitActionType.connectionChanged) {
          const {
            hasConnection: isConnected,
          } = payload as ConnectionChangedPayload;

          dispatch({
            type: LayoutActionType.CONNECTION_CHANGED,
            offlineItemsCount: getOfflineItemsCount(cache),
            isConnected,
          });
        }
      },
    });

    return () => {
      (subscriptionRef.current as ZenObservable.Subscription).unsubscribe();
    };
  }, [cache, observable]);

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
          offlineItemsCount: getOfflineItemsCount(cache),
          hasConnection: !!isConnected(),
        });
      })();
    },
    [restoreCacheOrPurgeStorage, dispatch, persistor, client, cache],
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
      <LayoutProvider
        value={{ offlineItemsCount: 0 } as ILayoutContextHeaderValue}
      >
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
              offlineItemsCount,
              hasConnection: hasConnection,
            } as ILayoutContextHeaderValue
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
