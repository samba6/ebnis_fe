import { createContext, Reducer, Dispatch, PropsWithChildren } from "react";
import immer from "immer";
import { RouteComponentProps, WindowLocation, NavigateFn } from "@reach/router";
import { wrapReducer } from "../../logger";
import { ConnectionStatus, isConnected } from "../../state/connections";
import { UserFragment } from "../../graphql/apollo-types/UserFragment";
// import { InMemoryCache } from "apollo-cache-inmemory";
import { getOfflineItemsCount } from "../../state/offline-resolvers";
import { preFetchExperiences } from "./pre-fetch-experiences";
import { RestoreCacheOrPurgeStorageFn } from "../../state/apollo-setup";
import { AppPersistor } from "../../context";
import { Observable } from "zen-observable-ts";
import {
  EmitPayload,
  EmitActionType,
  EmitActionConnectionChangedPayload,
} from "../../state/observable-manager";
import { cleanupObservableSubscription } from "./layout-injectables";

export enum LayoutActionType {
  SET_OFFLINE_ITEMS_COUNT = "@layout/set-offline-items-count",
  CACHE_PERSISTED = "@layout/render-children",
  EXPERIENCES_TO_PREFETCH = "@layout/experiences-to-pre-fetch",
  CONNECTION_CHANGED = "@layout/connection-changed",
  DONE_FETCHING_EXPERIENCES = "@layout/experiences-already-fetched",
  REFETCH_OFFLINE_ITEMS_COUNT = "@layout/refetch-offline-items-count",
  PUT_EFFECT_FUNCTIONS_ARGS = "@layout/put-effects-functions-args",
}

export const StateValue = {
  effectValNoEffect: "noEffect" as EffectValueNoEffect,
  effectValHasEffects: "hasEffects" as EffectValueHasEffects,
  prefetchValNeverFetched: "never-fetched" as PrefetchValNeverFetched,
  prefetchValFetchNow: "fetch-now" as PrefetchValFetchNow,
  prefetchValAlreadyFetched: "already-fetched" as PrefetchValAlreadyFetched,
};

export const reducer: Reducer<StateMachine, LayoutAction> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.runOnRenders.value = StateValue.effectValNoEffect;

        switch (type) {
          case LayoutActionType.CONNECTION_CHANGED:
            handleConnectionChangedAction(
              proxy,
              payload as ConnectionChangedPayload,
            );
            break;

          case LayoutActionType.CACHE_PERSISTED:
            handleCachePersistedAction(proxy, payload as CachePersistedPayload);
            break;

          case LayoutActionType.EXPERIENCES_TO_PREFETCH:
            handleExperiencesToPrefetch(
              proxy,
              payload as ExperiencesToPrefetchPayload,
            );
            break;

          case LayoutActionType.DONE_FETCHING_EXPERIENCES:
            proxy.states.prefetchExperiences.value =
              StateValue.prefetchValAlreadyFetched;
            break;

          case LayoutActionType.SET_OFFLINE_ITEMS_COUNT:
            proxy.context.offlineItemsCount = (payload as {
              count: number;
            }).count;
            break;

          case LayoutActionType.REFETCH_OFFLINE_ITEMS_COUNT:
            handleGetOfflineItemsCountAction(proxy);
            break;

          case LayoutActionType.PUT_EFFECT_FUNCTIONS_ARGS:
            handlePutEffectFunctionsArgs(proxy, payload as EffectFunctionsArgs);
            break;
        }
      });
    },
    // true,
  );

////////////////////////// EFFECT FUNCTIONS SECTION ///////////////////////

const getOfflineItemsCountEffect: GetOfflineItemsCountEffect["func"] = ({
  cache,
  dispatch,
}) => {
  dispatch({
    type: LayoutActionType.SET_OFFLINE_ITEMS_COUNT,
    count: getOfflineItemsCount(cache),
  });
};

type GetOfflineItemsCountEffect = LayoutEffectDefinition<
  "getOfflineItemsCount",
  "cache" | "dispatch"
>;

const prefetchExperiencesEffect: PrefetchExperiencesEffect["func"] = (
  { cache, client, dispatch },
  { ids },
) => {
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
};

type PrefetchExperiencesEffect = LayoutEffectDefinition<
  "prefetchExperiences",
  "cache" | "client" | "dispatch",
  {
    ids: string[];
  }
>;

const firstEffect: FirstEffect["func"] = async ({
  cache,
  dispatch,
  restoreCacheOrPurgeStorage,
  persistor,
}) => {
  if (cache && restoreCacheOrPurgeStorage) {
    try {
      await restoreCacheOrPurgeStorage(persistor);
    } catch (error) {}

    dispatch({
      type: LayoutActionType.CACHE_PERSISTED,
      offlineItemsCount: getOfflineItemsCount(cache),
      hasConnection: !!isConnected(),
    });
  }
};

type FirstEffect = LayoutEffectDefinition<
  "firstEffect",
  "dispatch" | "cache" | "restoreCacheOrPurgeStorage" | "persistor"
>;

const subscribeToObservableEffect: SubscribeToObservableEffect["func"] = ({
  dispatch,
  observable,
  cache,
}) => {
  const subscription = observable.subscribe({
    next({ type, ...payload }) {
      if (type === EmitActionType.connectionChanged) {
        const { hasConnection } = payload as EmitActionConnectionChangedPayload;

        dispatch({
          type: LayoutActionType.CONNECTION_CHANGED,
          offlineItemsCount: getOfflineItemsCount(cache),
          isConnected: hasConnection,
        });
      }
    },
  });

  return () => {
    cleanupObservableSubscription(subscription);
  };
};

type SubscribeToObservableEffect = LayoutEffectDefinition<
  "subscribeToObservable",
  "dispatch" | "observable" | "cache"
>;

export const effectFunctions = {
  getOfflineItemsCount: getOfflineItemsCountEffect,
  prefetchExperiences: prefetchExperiencesEffect,
  firstEffect,
  subscribeToObservable: subscribeToObservableEffect,
};

export function runEffects(
  effects: EffectObject,
  effectsArgsObj: EffectFunctionsArgs,
) {
  for (const { key, ownArgs, effectArgKeys } of effects) {
    const effectArgs = getEffectArgsFromKeys(
      effectArgKeys as (keyof EffectFunctionsArgs)[],
      effectsArgsObj,
    );

    effectFunctions[key](
      effectArgs,
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
      ownArgs as any,
    );
  }
}

export function getEffectArgsFromKeys(
  effectArgKeys: (keyof EffectFunctionsArgs)[],
  effectsArgsObj: EffectFunctionsArgs,
) {
  return effectArgKeys.reduce(
    (acc, k) => {
      acc[k] = effectsArgsObj[k];
      return acc;
    },
    {} as EffectFunctionsArgs,
  );
}

////////////////////////// END EFFECT FUNCTIONS SECTION /////////////////

////////////////////////// STATE UPDATE FUNCTIONS SECTION /////////////////

function handlePutEffectFunctionsArgs(
  globalState: StateMachine,
  payload: EffectFunctionsArgs,
) {
  globalState.effects.context.effectsArgsObj = payload;
  const [effectObjects] = prepareToAddRunOnRendersEffects(globalState);
  effectObjects.push({
    key: "firstEffect",
    ownArgs: {},
    effectArgKeys: [
      "cache",
      "dispatch",
      "restoreCacheOrPurgeStorage",
      "persistor",
    ],
  });

  globalState.effects.runOnce.subscribeToObservable = {
    run: true,
    effect: {
      key: "subscribeToObservable",
      ownArgs: {},
      effectArgKeys: ["dispatch", "observable", "cache"],
    },
  };
}

export function initState(args: InitStateArgs): StateMachine {
  const {
    connectionStatus: { isConnected },
    user,
  } = args;

  return {
    context: {
      offlineItemsCount: null,
      renderChildren: false,
      hasConnection: !!isConnected,
      user,
    },
    states: {
      prefetchExperiences: {
        value: StateValue.prefetchValNeverFetched,
      },
    },

    effects: {
      context: {
        effectsArgsObj: {} as EffectFunctionsArgs,
      },
      runOnRenders: {
        value: StateValue.effectValNoEffect,
      },
      runOnce: {},
    },
  };
}

function handleExperiencesToPrefetch(
  globalState: StateMachine,
  payload: ExperiencesToPrefetchPayload,
) {
  const {
    states: { prefetchExperiences },
    context: { user },
  } = globalState;

  const ids = (payload as ExperiencesToPrefetchPayload).ids;

  if (!user || !ids || ids.length === 0) {
    prefetchExperiences.value = StateValue.prefetchValNeverFetched;

    return;
  }

  (prefetchExperiences as YesPrefechtExperiences).context = { ids };

  if (!isConnected()) {
    prefetchExperiences.value = StateValue.prefetchValNeverFetched;
    return;
  }

  const [effectObjects] = prepareToAddRunOnRendersEffects(globalState);
  effectObjects.push({
    key: "prefetchExperiences",
    effectArgKeys: ["client", "cache", "dispatch"],
    ownArgs: { ids },
  });

  prefetchExperiences.value = StateValue.prefetchValAlreadyFetched;
}

function handleConnectionChangedAction(
  globalState: StateMachine,
  payload: ConnectionChangedPayload,
) {
  const { offlineItemsCount, isConnected } = payload;

  const { context, states } = globalState;
  const { user } = context;
  context.hasConnection = isConnected;

  if (!isConnected) {
    context.offlineItemsCount = 0;
  } else if (user) {
    context.offlineItemsCount = offlineItemsCount;
  }

  if (!user) {
    return;
  }

  const yesPrefetch = states.prefetchExperiences as YesPrefechtExperiences;

  if (
    isConnected &&
    states.prefetchExperiences.value === StateValue.prefetchValNeverFetched
  ) {
    if (yesPrefetch.context) {
      const [effectObjects] = prepareToAddRunOnRendersEffects(globalState);

      effectObjects.push({
        key: "prefetchExperiences",
        effectArgKeys: ["client", "dispatch", "cache"],
        ownArgs: {
          ids: yesPrefetch.context.ids,
        },
      });

      globalState.states.prefetchExperiences.value =
        StateValue.prefetchValAlreadyFetched;
    }
  }
}

function handleGetOfflineItemsCountAction(globalState: StateMachine) {
  const [effectObjects] = prepareToAddRunOnRendersEffects(globalState);
  effectObjects.push({
    key: "getOfflineItemsCount",
    effectArgKeys: ["cache", "dispatch"],
    ownArgs: {},
  });
}

function handleCachePersistedAction(
  globalState: StateMachine,
  payload: CachePersistedPayload,
) {
  globalState.context.renderChildren = true;

  const { hasConnection, offlineItemsCount } = payload;

  globalState.context.hasConnection = hasConnection;

  if (!hasConnection) {
    return;
  }

  globalState.context.offlineItemsCount = offlineItemsCount;
}

function prepareToAddRunOnRendersEffects(globalState: StateMachine) {
  const runOnRendersEffects = globalState.effects.runOnRenders as EffectState;
  runOnRendersEffects.value = StateValue.effectValHasEffects;
  const effectObjects: EffectObject = [];
  const cleanupEffectObjects: EffectObject = [];
  runOnRendersEffects.hasEffects = {
    context: {
      effects: effectObjects,
      cleanupEffects: cleanupEffectObjects,
    },
  };

  return [effectObjects, cleanupEffectObjects];
}

///////////////////// END STATE UPDATE FUNCTIONS SECTION //////////////

export const LayoutContextHeader = createContext<ILayoutContextHeaderValue>({
  offlineItemsCount: 0,
} as ILayoutContextHeaderValue);

export const LayoutUnchangingContext = createContext<
  ILayoutUnchangingContextValue
>({} as ILayoutUnchangingContextValue);

export const LayoutContextExperience = createContext<
  ILayoutContextExperienceValue
>({} as ILayoutContextExperienceValue);

export const LocationContext = createContext<ILocationContextValue>(
  {} as ILocationContextValue,
);

////////////////////////// TYPES ////////////////////////////

export type LayoutAction =
  | {
      type: LayoutActionType.SET_OFFLINE_ITEMS_COUNT;
      count: number;
    }
  | {
      type: LayoutActionType.CACHE_PERSISTED;
      offlineItemsCount: number | null;
      hasConnection: boolean;
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
    }
  | {
      type: LayoutActionType.REFETCH_OFFLINE_ITEMS_COUNT;
    }
  | {
      type: LayoutActionType.PUT_EFFECT_FUNCTIONS_ARGS;
    } & EffectFunctionsArgs;

interface ExperiencesToPrefetchPayload {
  ids: string[] | null;
}

interface ConnectionChangedPayload {
  isConnected: boolean;
  offlineItemsCount: number;
}

interface CachePersistedPayload {
  offlineItemsCount: number;
  hasConnection: boolean;
}

export interface StateMachine {
  context: {
    hasConnection: boolean;
    offlineItemsCount: number | null;
    renderChildren: boolean;
    user: UserFragment | null;
  };

  states: {
    prefetchExperiences: PrefetchExperiencesState;
  };

  readonly effects: ({
    runOnRenders: EffectState | { value: EffectValueNoEffect };
    runOnce: {
      subscribeToObservable?: SubscribeToObservableState;
    };
  }) & {
    context: EffectContext;
  };
}

export interface SubscribeToObservableState {
  run: boolean;
  effect: SubscribeToObservableEffect;
}

type PrefetchValNeverFetched = "never-fetched";
type PrefetchValFetchNow = "fetch-now";
type PrefetchValAlreadyFetched = "already-fetched";

type PrefetchExperiencesState =
  | {
      value: PrefetchValNeverFetched;
    }
  | {
      value: PrefetchValAlreadyFetched;
    }
  | YesPrefechtExperiences;

interface YesPrefechtExperiences {
  value: PrefetchValFetchNow;
  context: {
    ids: string[];
  };
}

export type LayoutDispatchType = Dispatch<LayoutAction>;

export interface Props extends PropsWithChildren<{}>, RouteComponentProps {}

export interface ILayoutContextHeaderValue {
  offlineItemsCount: number;
  hasConnection: boolean;
}

export interface ILayoutUnchangingContextValue {
  layoutDispatch: LayoutDispatchType;
}

export interface ILayoutContextExperienceValue {
  fetchExperience: PrefetchExperiencesState["value"];
}

interface ILocationContextValue extends WindowLocation {
  navigate: NavigateFn;
}

type EffectValueNoEffect = "noEffect";
type EffectValueHasEffects = "hasEffects";

interface EffectContext {
  effectsArgsObj: EffectFunctionsArgs;
}

type EffectObject = (
  | GetOfflineItemsCountEffect
  | PrefetchExperiencesEffect
  | FirstEffect
  | SubscribeToObservableEffect)[];

interface EffectState {
  value: EffectValueHasEffects;
  hasEffects: {
    context: {
      effects: EffectObject;
      cleanupEffects: EffectObject;
    };
  };
}

export interface EffectFunctionsArgs {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
  cache: any; // InMemoryCache;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
  client: any; // ApolloClient
  dispatch: LayoutDispatchType;
  restoreCacheOrPurgeStorage: RestoreCacheOrPurgeStorageFn | undefined;
  persistor: AppPersistor;
  observable: Observable<EmitPayload>;
}

interface LayoutEffectDefinition<
  Key extends keyof typeof effectFunctions,
  EffectArgKeys extends keyof EffectFunctionsArgs,
  OwnArgs = {}
> {
  key: Key;
  effectArgKeys: EffectArgKeys[];
  ownArgs: OwnArgs;
  func?: (
    effectArgs: { [k in EffectArgKeys]: EffectFunctionsArgs[k] },
    ownArgs: OwnArgs,
  ) => void | Promise<void | (() => void)> | (() => void);
}

export interface InitStateArgs {
  connectionStatus: ConnectionStatus;
  user: UserFragment | null;
}
