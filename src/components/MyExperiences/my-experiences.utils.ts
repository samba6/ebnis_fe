import { RouteComponentProps, NavigateFn } from "@reach/router";
import { ExperienceConnectionFragment_edges_node } from "../../graphql/apollo-types/ExperienceConnectionFragment";
import { ApolloError } from "apollo-client";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import fuzzysort from "fuzzysort";
import { Reducer, Dispatch } from "react";
import { wrapReducer } from "../../logger";
import immer, { Draft } from "immer";
import { DeleteExperiencesComponentProps } from "../../graphql/delete-experiences.mutation";
import { isOfflineId } from "../../constants";
import { deleteExperiencesFromCache } from "../../apollo-cache/delete-experiences-from-cache";
import { InMemoryCache } from "apollo-cache-inmemory";
import { parseStringError, StringyErrorPayload } from "../../general-utils";
import { AppPersistor } from "../../context";
import { removeQueriesAndMutationsFromCache } from "../../state/resolvers/delete-references-from-cache";

export const StateValue = {
  deletingExperience: "deletingExperience" as DeletingExperienceVal,
  inactive: "inactive" as InActiveVal,
  active: "active" as ActiveVal,
  searching: "searching" as SearchingVal,
  results: "results" as ResultsVal,
  confirmed: "confirmed" as ConfirmedVal,
  cancelled: "cancelled" as CancelledVal,
  ok: "ok" as OkVal,
  noEffect: "noEffect" as NoEffectVal,
  hasEffects: "hasEffects" as HasEffectsVal,
  prompt: "prompt" as PromptVal,
  deleted: "deleted" as DeletedVal,
  success: "success" as SuccessVal,
  errors: "errors" as ErrorsVal,
};

export enum ActionType {
  SET_SEARCH_TEXT = "@my-experiences/set-search-text",
  TOGGLE_DESCRIPTION = "@my-experiences/toggle-description",
  SEARCH = "@my-experiences/search",
  ON_EXPERIENCES_CHANGED = "@my-experiences/on-experiences-changed",
  CLEAR_SEARCH = "@my-experiences/clear-search",
  DELETE_EXPERIENCE = "@my-experiences/delete-experience",
  CONFIRM_DELETE_EXPERIENCE = "@my-experiences/confirm-delete-experience",
  ON_DELETE_EXPERIENCE_ERROR = "@my-experiences/on-delete-experience-error",
  ON_DELETE_EXPERIENCE_SUCCESS = "@my-experiences/on-delete-experience-success",
  CONCLUDE_DELETE_EXPERIENCE_SUCCESS = "@my-experiences/conclude-delete-experience-success",
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.general.value = StateValue.noEffect;
        delete proxy.effects.general[StateValue.hasEffects];

        switch (type) {
          case ActionType.SET_SEARCH_TEXT:
            handleSetSearchTextAction(proxy, payload as SetSearchTextPayload);
            break;

          case ActionType.SEARCH:
            handleSearchAction(proxy, payload as SetSearchTextPayload);
            break;

          case ActionType.ON_EXPERIENCES_CHANGED:
            handleOnExperiencesChangedAction(
              proxy,
              payload as ExperiencesChangedPayload,
            );
            break;

          case ActionType.TOGGLE_DESCRIPTION:
            handleToggleDescriptionAction(
              proxy,
              payload as ToggleDescriptionPayload,
            );
            break;

          case ActionType.CLEAR_SEARCH:
            handleClearSearch(proxy);
            break;

          case ActionType.DELETE_EXPERIENCE:
            handleDeleteExperienceAction(
              proxy,
              payload as DeleteExperiencePayload,
            );
            break;

          case ActionType.CONFIRM_DELETE_EXPERIENCE:
            handleConfirmDeleteExperienceAction(
              proxy,
              payload as ConfirmDeleteExperiencePayload,
            );
            break;

          case ActionType.ON_DELETE_EXPERIENCE_ERROR:
          case ActionType.ON_DELETE_EXPERIENCE_SUCCESS:
            handleOnDeleteExperience(proxy, payload as StringyErrorPayload);
            break;

          case ActionType.CONCLUDE_DELETE_EXPERIENCE_SUCCESS:
            handleConcludeDeleteExperienceSuccessAction(proxy);
            break;
        }
      });
    },

    // true,
  );

////////////////////////// START EFFECT SECTION ////////////////////////////

export const GENERIC_SERVER_ERROR = "Something went wrong - please try again.";

function getGeneralEffects(proxy: DraftState) {
  const generalEffects = proxy.effects.general as EffectState;
  generalEffects.value = StateValue.hasEffects;
  let effects: EffectsList = [];

  // istanbul ignore next: trivial
  if (!generalEffects.hasEffects) {
    generalEffects.hasEffects = {
      context: {
        effects,
      },
    };
  } else {
    // istanbul ignore next: trivial
    effects = generalEffects.hasEffects.context.effects;
  }

  return effects;
}

const deleteExperienceEffect: DeleteExperienceEffect["func"] = async (
  { id },
  props,
  effectArgs,
) => {
  const input = [id];
  const { persistor, cache, deleteExperiences } = props;
  const { dispatch } = effectArgs;

  if (isOfflineId(id)) {
    deleteExperiencesFromCache(cache, input);
    await persistor.persist();

    dispatch({
      type: ActionType.ON_DELETE_EXPERIENCE_SUCCESS,
    });

    return;
  }

  try {
    const result = await deleteExperiences({
      variables: {
        input,
      },
    });

    const validResponse =
      result && result.data && result.data.deleteExperiences;

    if (!validResponse) {
      dispatch({
        type: ActionType.ON_DELETE_EXPERIENCE_ERROR,
        error: GENERIC_SERVER_ERROR,
      });

      return;
    }

    if (validResponse.__typename === "DeleteExperiencesAllFail") {
      dispatch({
        type: ActionType.ON_DELETE_EXPERIENCE_ERROR,
        error: validResponse.error,
      });
    } else {
      const deleteResult = validResponse.experiences[0];

      if (deleteResult.__typename === "DeleteExperienceErrors") {
        dispatch({
          type: ActionType.ON_DELETE_EXPERIENCE_ERROR,
          error: deleteResult.errors.error,
        });
      } else {
        deleteExperiencesFromCache(cache, input);
        removeQueriesAndMutationsFromCache(cache, ["deleteExperiences"]);
        await persistor.persist();

        dispatch({
          type: ActionType.ON_DELETE_EXPERIENCE_SUCCESS,
        });
      }
    }
  } catch (error) {
    dispatch({
      type: ActionType.ON_DELETE_EXPERIENCE_ERROR,
      error,
    });
  }
};

type DeleteExperienceEffect = EffectDefinition<
  "deleteExperienceEffect",
  { id: string }
>;

const reloadPageEffect: ReloadPageEffectDefinition["func"] = () => {
  window.location.reload();
};

type ReloadPageEffectDefinition = EffectDefinition<"reloadPageEffect">;

export const effectFunctions = {
  deleteExperienceEffect,
  reloadPageEffect,
};

////////////////////////// END EFFECT SECTION ///////////////////////

////////////////////////// STATE UPDATE SECTION /////////////

export function initState(experiences: ExperienceFragment[]): StateMachine {
  return {
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
    context: {
      idToShowingDescriptionMap: makeIdToShowingDescriptionMap(experiences),
      experiencesPrepared: prepareExperiencesForSearch(experiences),
    },
    states: {
      search: {
        value: StateValue.inactive,
        searchText: "",
      },
      deleteExperience: {
        value: StateValue.inactive,
      },
    },
  };
}

function makeIdToShowingDescriptionMap(experiences: ExperienceFragment[]) {
  return experiences.reduce((acc, experience) => {
    const { description, id } = experience;

    if (description) {
      acc[id] = false;
    }

    return acc;
  }, {} as DescriptionMap);
}

function handleSetSearchTextAction(
  proxy: DraftState,
  { text }: SetSearchTextPayload,
) {
  const { states } = proxy;
  const search = states.search as SearchState;
  search.value = StateValue.searching;
  search.searchText = text;
}

function handleSearchAction(proxy: DraftState, { text }: SetSearchTextPayload) {
  const {
    states,
    context: { experiencesPrepared },
  } = proxy;
  const search = states.search as SearchResults;
  search.value = StateValue.results;

  const results = fuzzysort
    .go(text, experiencesPrepared, {
      key: "title",
    })
    .map(searchResult => {
      const { obj } = searchResult;

      return {
        title: obj.title,
        id: obj.id,
      };
    });

  search.results = search.results || { context: { results } };
  search.results.context.results = results;
}

function handleOnExperiencesChangedAction(
  proxy: DraftState,
  { experiences }: ExperiencesChangedPayload,
) {
  const { context } = proxy;

  context.idToShowingDescriptionMap = makeIdToShowingDescriptionMap(
    experiences,
  );

  context.experiencesPrepared = prepareExperiencesForSearch(experiences);
}

function handleToggleDescriptionAction(
  proxy: DraftState,
  { id }: ToggleDescriptionPayload,
) {
  const {
    context: { idToShowingDescriptionMap },
    states: { search },
  } = proxy;

  idToShowingDescriptionMap[id] = !idToShowingDescriptionMap[id];
  search.value = StateValue.inactive;
}

function handleClearSearch(proxy: DraftState) {
  const {
    states: { search },
  } = proxy;

  search.value = StateValue.inactive;
  search.searchText = "";
}

function handleDeleteExperienceAction(
  proxy: DraftState,
  payload: DeleteExperiencePayload,
) {
  const { experience } = payload;

  const {
    states: { deleteExperience },
  } = proxy;

  deleteExperience.value = StateValue.active;

  const currentDeleteExperience = deleteExperience as DeleteExperienceActiveState;

  currentDeleteExperience.active = {
    context: {
      experience,
    },
    states: {
      value: StateValue.prompt,
    },
  };
}

function handleConfirmDeleteExperienceAction(
  proxy: DraftState,
  payload: ConfirmDeleteExperiencePayload,
) {
  const {
    states: { deleteExperience },
  } = proxy;

  const { confirmation } = payload;

  if (confirmation === StateValue.cancelled) {
    deleteExperience.value = StateValue.inactive;
    return;
  }

  const activeState = (deleteExperience as DeleteExperienceActiveState).active;
  activeState.states.value = StateValue.deletingExperience;
  const effects = getGeneralEffects(proxy);

  effects.push({
    key: "deleteExperienceEffect",
    ownArgs: { id: activeState.context.experience.id },
  });
}

function handleOnDeleteExperience(
  proxy: DraftState,
  payload: StringyErrorPayload,
) {
  const {
    states: { deleteExperience },
  } = proxy;

  const states = (deleteExperience as DeleteExperienceActiveState).active
    .states as ExperienceDeletedState;

  states.value = StateValue.deleted;
  states.deleted = {
    states: {} as ExperienceDeletedState["deleted"]["states"],
  };

  if (!payload.error) {
    states.deleted.states.value = StateValue.success;
    return;
  }

  const deleteErrorState = states.deleted
    .states as ExperienceDeletedErrorsState;
  deleteErrorState.value = StateValue.errors;
  deleteErrorState.context = {
    error: parseStringError(payload.error),
  };
}

function handleConcludeDeleteExperienceSuccessAction(proxy: DraftState) {
  const {
    states: { deleteExperience },
  } = proxy;
  deleteExperience.value = StateValue.inactive;
  const effects = getGeneralEffects(proxy);
  effects.push({
    key: "reloadPageEffect",
    ownArgs: {},
  });
}

////////////////////////// END STATE UPDATE SECTION /////////////

export function prepareExperiencesForSearch(experiences: ExperienceFragment[]) {
  return experiences.map(({ id, title }) => {
    return {
      id,
      title,
      target: fuzzysort.prepare(title) as Fuzzysort.Prepared,
    };
  });
}

////////////////////////// STRINGY TYPES SECTION //////////////////////

type InActiveVal = "inactive";
type SearchingVal = "searching";
type ResultsVal = "results";
type NoEffectVal = "noEffect";
type HasEffectsVal = "hasEffects";
type ActiveVal = "active";
type ConfirmedVal = "confirmed";
type CancelledVal = "cancelled";
type OkVal = "ok";
type PromptVal = "prompt";
type DeletedVal = "deleted";
// type SubmittingVal = "submitting";
// type UnChangedVal = "unchanged";
// type ChangedVal = "changed";
// type ValidVal = "valid";
// type InvalidVal = "invalid";
// type InitialVal = "initial";
type SuccessVal = "success";
type ErrorsVal = "errors";
type DeletingExperienceVal = "deletingExperience";
// type WarningVal = "warning";

////////////////////////// END STRINGY TYPES SECTION /////////////////

////////////////////////// TYPES SECTION ////////////////////////////

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly context: {
    idToShowingDescriptionMap: DescriptionMap;
    experiencesPrepared: ExperiencesSearchPrepared;
  };
  readonly states: {
    search: SearchState;
    deleteExperience: { value: InActiveVal } | DeleteExperienceActiveState;
  };
  readonly effects: {
    general: EffectState | { value: NoEffectVal };
  };
}

interface EffectState {
  value: HasEffectsVal;
  hasEffects: {
    context: {
      effects: EffectsList;
    };
  };
}

type EffectsList = (DeleteExperienceEffect | ReloadPageEffectDefinition)[];

interface FormInput {
  field1: string;
}

export interface DeleteExperienceActiveState {
  value: ActiveVal;
  active: {
    context: {
      experience: ExperienceFragment;
    };
    states:
      | { value: PromptVal }
      | { value: DeletingExperienceVal }
      | ExperienceDeletedState;
  };
}

interface ExperienceDeletedState {
  value: DeletedVal;
  deleted: {
    states: { value: SuccessVal } | ExperienceDeletedErrorsState;
  };
}

interface ExperienceDeletedErrorsState {
  value: ErrorsVal;
  context: {
    error: string;
  };
}

export type SearchState = {
  searchText: string;
} & (
  | {
      value: "inactive";
    }
  | {
      value: "searching";
    }
  | SearchResults
);

export interface SearchResults {
  value: "results";

  results: {
    context: {
      results: MySearchResult[];
    };
  };
}

interface MySearchResult {
  title: string;
  id: string;
}

export type ExperiencesSearchPrepared = {
  target: Fuzzysort.Prepared;
  title: string;
  id: string;
}[];

type Action =
  | {
      type: ActionType.CONCLUDE_DELETE_EXPERIENCE_SUCCESS;
    }
  | ({
      type: ActionType.ON_DELETE_EXPERIENCE_ERROR;
    } & StringyErrorPayload)
  | {
      type: ActionType.ON_DELETE_EXPERIENCE_SUCCESS;
    }
  | ({
      type: ActionType.CONFIRM_DELETE_EXPERIENCE;
    } & ConfirmDeleteExperiencePayload)
  | ({
      type: ActionType.TOGGLE_DESCRIPTION;
    } & ToggleDescriptionPayload)
  | ({
      type: ActionType.SET_SEARCH_TEXT;
    } & SetSearchTextPayload)
  | ({
      type: ActionType.SEARCH;
    } & SetSearchTextPayload)
  | ({
      type: ActionType.ON_EXPERIENCES_CHANGED;
    } & ExperiencesChangedPayload)
  | {
      type: ActionType.CLEAR_SEARCH;
    }
  | ({
      type: ActionType.DELETE_EXPERIENCE;
    } & DeleteExperiencePayload);

interface ConfirmDeleteExperiencePayload {
  confirmation: OkVal | CancelledVal;
}

interface DeleteExperiencePayload {
  experience: ExperienceConnectionFragment_edges_node;
}

interface ExperiencesChangedPayload {
  experiences: ExperienceFragment[];
}

interface ToggleDescriptionPayload {
  id: string;
}

interface SetSearchTextPayload {
  text: string;
}

export interface ComponentProps extends DeleteExperiencesComponentProps {
  navigate: NavigateFn;
  experiences: ExperienceConnectionFragment_edges_node[];
  loading: boolean;
  error?: ApolloError;
  experiencesPrepared: ExperiencesSearchPrepared;
  cache: InMemoryCache;
  persistor: AppPersistor;
}

export type CallerProps = RouteComponentProps<{}>;

export interface DescriptionMap {
  [k: string]: boolean;
}

export interface ExperienceProps {
  showingDescription: boolean;
  experience: ExperienceConnectionFragment_edges_node;
  navigate: NavigateFn;
  dispatch: DispatchType;
}

export interface NoneStateContextValue {
  navigate: NavigateFn;
}

export type SearchComponentProps = {
  dispatch: DispatchType;
  experiencesLen: number;
  searchState: StateMachine["states"]["search"];
};

export type DispatchType = Dispatch<Action>;

interface EffectArgs {
  dispatch: DispatchType;
}

interface EffectDefinition<
  Key extends keyof typeof effectFunctions,
  OwnArgs = {}
> {
  key: Key;
  ownArgs: OwnArgs;
  func?: (
    ownArgs: OwnArgs,
    effectArgs: ComponentProps,
    lastArgs: EffectArgs,
  ) => void | Promise<void | (() => void)> | (() => void);
}
