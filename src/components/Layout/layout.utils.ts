import { createContext, Reducer, Dispatch, PropsWithChildren } from "react";
import immer from "immer";
import { RouteComponentProps, WindowLocation, NavigateFn } from "@reach/router";
import { wrapReducer } from "../../logger";
import { ConnectionStatus } from "../../state/connections";
import { UserFragment } from "../../graphql/apollo-types/UserFragment";
import { getOfflineItemsCount } from "../../state/offline-resolvers";
import { preFetchExperiences } from "./layout-injectables";
import { EbnisContextProps } from "../../context";

export enum LayoutActionType {
  SET_OFFLINE_ITEMS_COUNT = "@layout/set-offline-items-count",
  CACHE_PERSISTED = "@layout/render-children",
  CONNECTION_CHANGED = "@layout/connection-changed",
  DONE_FETCHING_EXPERIENCES = "@layout/experiences-already-fetched",
  REFETCH_OFFLINE_ITEMS_COUNT = "@layout/refetch-offline-items-count",
}

export const StateValue = {
  noEffect: "noEffect" as NoEffectValue,
  hasEffects: "hasEffects" as HasEffectsVal,
  neverFetched: "never-fetched" as NeverFetchedVal,
  alreadyFetched: "already-fetched" as AlreadyFetchedVal,
  getOfflineItemsCount: "getOfflineItemsCount" as GetOfflineItemsCountEffectVal,
  prefetchExperiences: "prefetchExperiences" as PrefetchExperiencesEffectVal,
};

export const reducer: Reducer<StateMachine, LayoutAction> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.runOnRenders.value = StateValue.noEffect;

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

          case LayoutActionType.DONE_FETCHING_EXPERIENCES:
            proxy.states.prefetchExperiences.value = StateValue.alreadyFetched;
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

type GetOfflineItemsCountEffect = EffectDefinition<
  GetOfflineItemsCountEffectVal
>;
export type GetOfflineItemsCountEffectVal = "getOfflineItemsCount";

const prefetchExperiencesEffect: PrefetchExperiencesEffect["func"] = (
  _,
  { cache, client },
  { dispatch },
) => {
  setTimeout(() => {
    preFetchExperiences({
      client,
      cache,
      onDone: () => {
        dispatch({
          type: LayoutActionType.DONE_FETCHING_EXPERIENCES,
        });
      },
    });
  }, 1500);
};

type PrefetchExperiencesEffect = EffectDefinition<PrefetchExperiencesEffectVal>;
type PrefetchExperiencesEffectVal = "prefetchExperiences";

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
        value: StateValue.neverFetched,
      },
    },

    effects: {
      runOnRenders: {
        value: StateValue.noEffect,
      },
    },
  };
}

function handleConnectionChangedAction(
  proxy: StateMachine,
  payload: ConnectionChangedPayload,
) {
  const { isConnected } = payload;

  const { context } = proxy;
  const { user } = context;
  context.hasConnection = isConnected;

  if (!isConnected) {
    context.offlineItemsCount = 0;
  } else if (user) {
    const effectObjects = getRenderEffects(proxy);
    // globalState.states.prefetchExperiences.value

    effectObjects.push({
      key: StateValue.getOfflineItemsCount,
      ownArgs: {},
    });

    handlePrefetchExperiencesHelper(effectObjects, proxy);
  }
}

function handlePrefetchExperiencesHelper(
  effectObjects: EffectsList,
  proxy: StateMachine,
) {
  if (
    !proxy.context.user ||
    proxy.states.prefetchExperiences.value === StateValue.alreadyFetched
  ) {
    return;
  }

  effectObjects.push({
    key: StateValue.prefetchExperiences,
    ownArgs: {},
  });
}

function handleGetOfflineItemsCountAction(proxy: StateMachine) {
  if (!proxy.context.hasConnection) {
    return;
  }

  const effectObjects = getRenderEffects(proxy);
  effectObjects.push({
    key: StateValue.getOfflineItemsCount,
    ownArgs: {},
  });
}

function handleCachePersistedAction(
  proxy: StateMachine,
  payload: CachePersistedPayload,
) {
  proxy.context.renderChildren = true;

  const { hasConnection } = payload;

  proxy.context.hasConnection = hasConnection;

  if (!hasConnection) {
    return;
  }

  const effectObjects = getRenderEffects(proxy);

  effectObjects.push({
    key: StateValue.getOfflineItemsCount,
    ownArgs: {},
  });

  handlePrefetchExperiencesHelper(effectObjects, proxy);
}

function getRenderEffects(globalState: StateMachine) {
  const runOnRendersEffects = globalState.effects.runOnRenders as EffectState;
  runOnRendersEffects.value = StateValue.hasEffects;
  const effectObjects: EffectsList = [];

  runOnRendersEffects.hasEffects = {
    context: {
      effects: effectObjects,
    },
  };

  return effectObjects;
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
  | ({
      type: LayoutActionType.CACHE_PERSISTED;
    } & CachePersistedPayload)
  | ({
      type: LayoutActionType.CONNECTION_CHANGED;
    } & ConnectionChangedPayload)
  | {
      type: LayoutActionType.DONE_FETCHING_EXPERIENCES;
    }
  | {
      type: LayoutActionType.REFETCH_OFFLINE_ITEMS_COUNT;
    };

interface ConnectionChangedPayload {
  isConnected: boolean;
}

interface CachePersistedPayload {
  hasConnection: boolean;
}

export interface StateMachine {
  readonly context: {
    hasConnection: boolean;
    offlineItemsCount: number | null;
    renderChildren: boolean;
    user: UserFragment | null;
  };
  readonly states: {
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

type NeverFetchedVal = "never-fetched";
type PrefetchValFetchNow = "fetch-now";
type AlreadyFetchedVal = "already-fetched";
export type PrefetchValues =
  | NeverFetchedVal
  | PrefetchValFetchNow
  | AlreadyFetchedVal;

type PrefetchExperiencesState =
  | {
      value: NeverFetchedVal;
    }
  | {
      value: AlreadyFetchedVal;
    };

export type LayoutDispatchType = Dispatch<LayoutAction>;

export interface Props extends PropsWithChildren<{}>, RouteComponentProps {}

export interface LayoutContextValue extends WindowLocation {
  offlineItemsCount: number;
  hasConnection: boolean;
  navigate: NavigateFn;
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

////////////////////////// STRINGY TYPES SECTION /////////////////////
type NoEffectValue = "noEffect";
type HasEffectsVal = "hasEffects";
////////////////////////// END STRINGY TYPES SECTION /////////////////

type EffectsList = (GetOfflineItemsCountEffect | PrefetchExperiencesEffect)[];

export interface EffectState {
  value: HasEffectsVal;
  hasEffects: {
    context: {
      effects: EffectsList;
    };
  };
}

interface ThirdEffectFunctionArgs {
  dispatch: Dispatch<LayoutAction>;
}

interface EffectDefinition<
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
