import { createContext, Reducer, Dispatch, PropsWithChildren } from "react";
import immer from "immer";
import { RouteComponentProps, WindowLocation, NavigateFn } from "@reach/router";
import { wrapReducer } from "../../logger";
import { ConnectionStatus, isConnected } from "../../state/connections";
import { UserFragment } from "../../graphql/apollo-types/UserFragment";
// import { InMemoryCache } from "apollo-cache-inmemory";
import { getOfflineItemsCount } from "../../state/offline-resolvers";
import { preFetchExperiences } from "./pre-fetch-experiences";
import { EbnisContextProps } from "../../context";

export enum LayoutActionType {
  SET_OFFLINE_ITEMS_COUNT = "@layout/set-offline-items-count",
  CACHE_PERSISTED = "@layout/render-children",
  EXPERIENCES_TO_PREFETCH = "@layout/experiences-to-pre-fetch",
  CONNECTION_CHANGED = "@layout/connection-changed",
  DONE_FETCHING_EXPERIENCES = "@layout/experiences-already-fetched",
  REFETCH_OFFLINE_ITEMS_COUNT = "@layout/refetch-offline-items-count",
}

export const StateValue = {
  effectValNoEffect: "noEffect" as NoEffectValue,
  effectValHasEffects: "hasEffects" as HasEffectsVal,
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
        }
      });
    },
    // true,
  );

////////////////////////// EFFECT FUNCTIONS SECTION ///////////////////////

const getOfflineItemsCountEffect: GetOfflineItemsCountEffect["func"] = (
  _,
  { cache },
  { dispatch },
) => {
  dispatch({
    type: LayoutActionType.SET_OFFLINE_ITEMS_COUNT,
    count: getOfflineItemsCount(cache),
  });
};

type GetOfflineItemsCountEffect = LayoutEffectDefinition<
  "getOfflineItemsCount"
>;

const prefetchExperiencesEffect: PrefetchExperiencesEffect["func"] = (
  { ids },
  { cache, client },
  { dispatch },
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
  {
    ids: string[];
  }
>;

export const effectFunctions = {
  getOfflineItemsCount: getOfflineItemsCountEffect,
  prefetchExperiences: prefetchExperiencesEffect,
};

export function runEffects(
  effects: EffectsList,
  context: EbnisContextProps,
  thirdArgs: ThirdEffectFunctionArgs,
) {
  for (const { key, ownArgs } of effects) {
    effectFunctions[key](
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
      ownArgs as any,
      context,
      thirdArgs,
    );
  }
}

////////////////////////// END EFFECT FUNCTIONS SECTION /////////////////

////////////////////////// STATE UPDATE FUNCTIONS SECTION /////////////////

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
      runOnRenders: {
        value: StateValue.effectValNoEffect,
      },
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

  const [effectObjects] = getRenderEffects(globalState);
  effectObjects.push({
    key: "prefetchExperiences",
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
      const [effectObjects] = getRenderEffects(globalState);

      effectObjects.push({
        key: "prefetchExperiences",
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
  const [effectObjects] = getRenderEffects(globalState);
  effectObjects.push({
    key: "getOfflineItemsCount",
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

function getRenderEffects(globalState: StateMachine) {
  const runOnRendersEffects = globalState.effects.runOnRenders as EffectState;
  runOnRendersEffects.value = StateValue.effectValHasEffects;
  const effectObjects: EffectsList = [];
  const cleanupEffectObjects: EffectsList = [];
  runOnRendersEffects.hasEffects = {
    context: {
      effects: effectObjects,
      cleanupEffects: cleanupEffectObjects,
    },
  };

  return [effectObjects, cleanupEffectObjects];
}

///////////////////// END STATE UPDATE FUNCTIONS SECTION //////////////

export const LayoutContext = createContext<LayoutContextValue>({
  offlineItemsCount: 0,
} as LayoutContextValue);

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
  | ({
      type: LayoutActionType.CONNECTION_CHANGED;
    } & ConnectionChangedPayload)
  | {
      type: LayoutActionType.DONE_FETCHING_EXPERIENCES;
    }
  | {
      type: LayoutActionType.REFETCH_OFFLINE_ITEMS_COUNT;
    };

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

  readonly effects: {
    runOnRenders: EffectState | { value: NoEffectValue };
  };
}

interface RunOnceEffectState<IEffect> {
  run: boolean;
  effect: IEffect;
}

type PrefetchValNeverFetched = "never-fetched";
type PrefetchValFetchNow = "fetch-now";
type PrefetchValAlreadyFetched = "already-fetched";
export type PrefetchValues =
  | PrefetchValNeverFetched
  | PrefetchValFetchNow
  | PrefetchValAlreadyFetched;

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

export interface LayoutContextValue {
  offlineItemsCount: number;
  hasConnection: boolean;
}

export interface ILayoutUnchangingContextValue {
  layoutDispatch: LayoutDispatchType;
}

export interface ILayoutContextExperienceValue {
  fetchExperience: PrefetchValues;
}

interface ILocationContextValue extends WindowLocation {
  navigate: NavigateFn;
}

type NoEffectValue = "noEffect";
type HasEffectsVal = "hasEffects";

type EffectsList = (
  | GetOfflineItemsCountEffect
  | PrefetchExperiencesEffect
)[];

interface EffectState {
  value: HasEffectsVal;
  hasEffects: {
    context: {
      effects: EffectsList;
      cleanupEffects: EffectsList;
    };
  };
}

interface ThirdEffectFunctionArgs {
  dispatch: Dispatch<LayoutAction>;
}

interface LayoutEffectDefinition<
  Key extends keyof typeof effectFunctions,
  OwnArgs = {}
> {
  key: Key;
  ownArgs: OwnArgs;
  func?: (
    ownArgs: OwnArgs,
    props: EbnisContextProps,
    thirdArgs: ThirdEffectFunctionArgs,
  ) => void | Promise<void | (() => void)> | (() => void);
}

export interface InitStateArgs {
  connectionStatus: ConnectionStatus;
  user: UserFragment | null;
}
