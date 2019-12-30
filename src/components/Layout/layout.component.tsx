import React, {
  useContext,
  useEffect,
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
  LayoutProvider,
  LayoutUnchangingProvider,
  LayoutExperienceProvider,
  LocationProvider,
} from "./layout-providers";
import { useUser } from "../use-user";
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
    if (effects.value !== StateValue.effectValHasEffects) {
      return;
    }

    const {
      context: { metaFunctions },
      hasEffects: { context },
    } = effects;

    const cleanupEffects: (() => void)[] = [];

    (async function runEffects() {
      for (const { key, ownArgs, effectArgKeys } of context.effects) {
        const args = (effectArgKeys as (keyof EffectFunctionsArgs)[]).reduce(
          (acc, k) => {
            acc[k] = metaFunctions[k];
            return acc;
          },
          {} as EffectFunctionsArgs,
        );

        const maybeCleanupEffect = await effectFunctions[key](
          args,
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
          ownArgs as any,
        );

        if ("function" === typeof maybeCleanupEffect) {
          cleanupEffects.push(maybeCleanupEffect);
        }
      }
    })();

    if (cleanupEffects.length) {
      return () => {
        cleanupEffects.forEach(f => f());
      };
    }

    // redundant - [tsserver 7030] [W] Not all code paths return a value.
    return;
  }, [effects]);

  useLayoutEffect(() => {
    dispatch({
      type: LayoutActionType.PUT_EFFECT_FUNCTIONS_ARGS,
      cache,
      dispatch,
      client,
      restoreCacheOrPurgeStorage,
      persistor,
      observable,
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

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
