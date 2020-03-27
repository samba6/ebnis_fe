import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { Dispatch, Reducer, createContext } from "react";
import immer, { Draft } from "immer";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import {
  FormObjVal,
  DispatchType as ExperienceDispatchType,
  ActionType as ExperienceActionType,
} from "../Experience/experience.utils";
import {
  DataTypes,
  UpdateDataObjectInput,
  CreateEntryInput,
} from "../../graphql/apollo-types/globalTypes";
import { wrapReducer } from "../../logger";
import { ApolloClient } from "apollo-client";
import { formObjToString, ISO_DATE_FORMAT } from "../NewEntry/new-entry.utils";
import parseISO from "date-fns/parseISO";
import parse from "date-fns/parse";
import { isOfflineId, makeApolloCacheRef } from "../../constants";
import { AppPersistor } from "../../context";
import { InMemoryCache } from "apollo-cache-inmemory";
import { LayoutDispatchType, LayoutContextValue } from "../Layout/layout.utils";
import { upsertExperienceWithEntry } from "../NewEntry/new-entry.injectables";
import { wipeReferencesFromCache } from "../../state/resolvers/delete-references-from-cache";
import { ENTRY_TYPE_NAME, DATA_OBJECT_TYPE_NAME } from "../../graphql/types";
import { scrollIntoView } from "../scroll-into-view";
import { scrollToTopId } from "./edit-entry-dom";
import {
  CommonErrorPayload,
  parseStringError,
  CommonError,
  FORM_CONTAINS_ERRORS_MESSAGE,
  GENERIC_SERVER_ERROR,
} from "../../general-utils";
import {
  UpdateExperiencesOnlineComponentProps,
  updateExperiencesOnlineEffectHelperFunc,
} from "../../graphql/experiences.mutation";
import { UpdateEntryFragment_dataObjects } from "../../graphql/apollo-types/UpdateEntryFragment";
import {
  CreateEntryErrorFragment,
  CreateEntryErrorFragment_dataObjects,
} from "../../graphql/apollo-types/CreateEntryErrorFragment";
import { DataObjectErrorFragment } from "../../graphql/apollo-types/DataObjectErrorFragment";
import {
  getUnsyncedExperience,
  UnsyncedModifiedExperience,
  writeUnsyncedExperience,
} from "../../apollo-cache/unsynced.resolvers";
import { EntryConnectionFragment_edges } from "../../graphql/apollo-types/EntryConnectionFragment";
import { EntryDispatchType } from "../Entry/entry.utils";

export enum ActionType {
  SUBMITTING = "@component/edit-entry/submitting",
  DESTROYED = "@component/edit-entry/destroy",
  UPDATE_ENTRY_ONLINE_RESPONSE = "@component/edit-entry/data-objects-submission-response",
  DATA_CHANGED = "@component/edit-entry/data-changed",
  DISMISS_SUBMISSION_RESPONSE_MESSAGE = "@component/edit-entry/dismiss-submission-response-message",
  ON_COMMON_ERROR = "@edit-entry/on-common-error",
  ON_CREATE_ENTRY_ERRORS = "@component/edit-entry/online-entry-created",
  CONNECTION_CHANGED = "@component/edit-entry/connection-changed",
}

export const StateValue = {
  noEffect: "noEffect" as NoEffectVal,
  hasEffects: "hasEffects" as HasEffectsVal,
  active: "active" as ActiveVal,
  inactive: "inactive" as InActiveVal,
  single: "single" as SingleVal,
  multiple: "multiple" as MultipleVal,
  submitting: "submitting" as SubmittingVal,
  apolloErrors: "apolloErrors" as ApolloErrorValue,
  otherErrors: "otherErrors" as OtherErrorsVal,
  online: "online" as OnlineVal,
  offline: "offline" as OfflineVal,
};

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer<StateMachine, Action>(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.general.value = StateValue.noEffect;
        delete proxy.effects.general[StateValue.hasEffects];

        switch (type) {
          case ActionType.DATA_CHANGED:
            handleDataChangedAction(proxy, payload as DataChangedPayload);
            break;

          case ActionType.SUBMITTING:
            handleSubmissionAction(proxy, payload as SubmittingPayload);
            break;

          case ActionType.UPDATE_ENTRY_ONLINE_RESPONSE:
            prepareSubmissionOnlineResponse(proxy, {
              key: "updatedOnline",
              data: (payload as UpdateDataObjectsOnlineSubmissionResponsePayload)
                .dataObjects,
            });
            break;

          case ActionType.ON_CREATE_ENTRY_ERRORS:
            prepareSubmissionOnlineResponse(proxy, {
              key: "createOnline",
              errors: (payload as CreateOnlineEntryErrorPayload).errors,
            });
            break;

          case ActionType.DISMISS_SUBMISSION_RESPONSE_MESSAGE:
            proxy.states.submission.value = StateValue.inactive;
            break;

          case ActionType.ON_COMMON_ERROR:
            handleOnCommonErrorAction(proxy, payload as CommonErrorPayload);
            break;
        }
      });
    },

    // true,
  );

export function initState(props: Props): StateMachine {
  const { entry, experience, hasConnection } = props;
  const { id: entryId } = entry;

  const idToDefinitionMap = (experience.dataDefinitions as DataDefinitionFragment[]).reduce(
    (acc, d) => {
      const definition = d as DataDefinitionFragment;
      acc[definition.id] = definition;
      return acc;
    },
    {} as { [k: string]: DataDefinitionFragment },
  );

  const dataStates = entry.dataObjects.reduce((statesMap, obj) => {
    const data = obj as DataObjectFragment;
    const { id, definitionId } = data;
    const { type, name: definitionName } = idToDefinitionMap[definitionId];

    statesMap[id] = {
      value: "unchanged",
      unchanged: {
        context: {},
      },
      context: {
        defaults: {
          ...data,
          parsedVal: formObjFromRawString(data.data),
          type,
          definitionName,
        } as DataState["context"]["defaults"],
      },
    };

    return statesMap;
  }, {} as DataStates);

  return {
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
    context: {
      entry,
      hasConnection,
    },
    states: {
      mode: {
        value: isOfflineId(entryId) ? StateValue.offline : StateValue.online,
      },
      editingData: {
        value: StateValue.inactive,
      },
      submission: {
        value: StateValue.inactive,
      },
      dataStates,
    },
  };
}

function handleSubmissionAction(proxy: DraftState, payload: SubmittingPayload) {
  proxy.states.submission.value = StateValue.submitting;
  const { hasConnection } = payload;
  const { states } = proxy;

  if (!hasConnection) {
    handleUpdateEntryOfflineAction(proxy);
    return;
  }

  if (proxy.states.mode.value === StateValue.offline) {
    handleCreateEntryOrExperienceAction(proxy);
    return;
  }

  const effects = getGeneralEffects(proxy);

  const [dataInput] = getDataObjectsForOnlineUpdate(proxy);

  states.submission = {
    value: StateValue.submitting,
    submitting: {
      context: {
        submittedCount: dataInput.length,
      },
    },
  };

  effects.push({
    key: "updateEntryOnlineEffect",
    ownArgs: {
      dataInput,
    },
  });
}

function handleOnCommonErrorAction(
  proxy: DraftState,
  payload: CommonErrorPayload,
) {
  const errors = parseStringError(payload.error);

  const otherErrorsState = {
    value: StateValue.otherErrors,
    otherErrors: {
      context: {
        errors,
      },
    },
  } as Submission;

  proxy.states.submission = {
    ...proxy.states.submission,
    ...otherErrorsState,
  };
}

function handleDataChangedAction(
  proxy: DraftState,
  payload: DataChangedPayload,
) {
  const { dataStates } = proxy.states;
  const { id, rawFormVal } = payload as DataChangedPayload;
  const state = dataStates[id];
  const { parsedVal, type } = state.context.defaults;

  const [original, stringed] = formObjToCompareString(type, rawFormVal);

  if (formObjToCompareString(type, parsedVal)[1] === stringed) {
    state.value = "unchanged";
  } else {
    state.value = "changed";
    const changedState = state as DataChangedState;

    changedState.changed = {
      context: {
        formValue: original,
        formValueString: stringed as string,
      },

      value: "normal",
    };
  }

  setEditingData(proxy);
}

function handleCreateEntryOnlineErrorAction(
  proxy: DraftState,
  context: SubmissionSuccessStateContext,
  errors: CreateEntryErrorFragment,
) {
  const {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
    __typename,
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
    meta,
    dataObjects,
    ...rest
  } = errors;

  const errorContext = context.invalidResponse as SubmissionInvalidResponse;
  errorContext.entry =
    FORM_CONTAINS_ERRORS_MESSAGE + "\n" + JSON.stringify(rest);

  if (!dataObjects) {
    return [0, 1];
  }

  let failureCount = 0;
  const { dataStates } = proxy.states;

  dataObjects.forEach(obj => {
    const {
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
      __typename,
      meta: { clientId },
      ...errors
    } = obj as CreateEntryErrorFragment_dataObjects;

    const dataState = dataStates[clientId as string];
    ++failureCount;

    putDataServerErrors(
      dataState as DataChangedState,
      errors as DataObjectErrorFragment,
    );
  });

  return [0, failureCount];
}

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

function prepareSubmissionOnlineResponse(
  proxy: DraftState,
  payload:
    | {
        key: "updatedOnline";
        data: UpdateEntryFragment_dataObjects[];
      }
    | {
        key: "createOnline";
        errors: CreateEntryErrorFragment;
      },
) {
  const { states } = proxy;
  const {
    submitting: {
      context: { submittedCount },
    },
  } = states.submission as Submitting;

  const context = {
    invalidResponse: {},
  } as SubmissionSuccessStateContext;

  let successCount = 0;
  let failureCount = 0;

  let t1 = "valid";
  let t2 = "valid";

  if (payload.key === "updatedOnline") {
    const [s, f, t] = handleUpdateEntryOnlineResponseAction(
      proxy,
      context,
      payload.data,
    ) as [number, number, string];

    successCount += s;
    failureCount += f;
    t1 = t;
  } else {
    const [s, f, t] = handleCreateEntryOnlineErrorAction(
      proxy,
      context,
      payload.errors,
    ) as [number, number, string];

    successCount += s;
    failureCount += f;
    t2 = t;
  }

  if (t1 === "valid" && t2 === "valid") {
    delete context.invalidResponse;
  }

  if (successCount + failureCount !== 0) {
    context.validResponse = {
      successes: successCount,
      failures: failureCount,
    };
  }

  const submissionSuccessResponse = {
    value: "submissionSuccess",
    submissionSuccess: {
      context,
    },
  } as SubmissionSuccessState;

  states.submission = {
    ...states.submission,
    ...submissionSuccessResponse,
  };

  if (submittedCount === successCount) {
    states.editingData.value = StateValue.inactive;
  }

  const effects = getGeneralEffects(proxy);

  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollToTopId,
    },
  });
}

function updateDataStateWithUpdatedDataObject(
  dataState: DataState,
  dataObject: DataObjectFragment,
): DataObjectFragment {
  dataState.context.defaults = {
    ...dataState.context.defaults,
    ...dataObject,
  };

  dataState.context.defaults.parsedVal = formObjFromRawString(dataObject.data);

  const unchangedState = (dataState as unknown) as DataUnchangedState;
  unchangedState.value = "unchanged";
  unchangedState.unchanged.context.anyEditSuccess = true;

  return dataState.context.defaults;
}

function handleUpdateEntryOnlineResponseAction(
  proxy: DraftState,
  context: SubmissionSuccessStateContext,
  dataObjectsResults: UpdateEntryFragment_dataObjects[],
) {
  let successCount = 0;
  let failureCount = 0;

  const {
    states: { dataStates },
    context: { entry },
  } = proxy;

  const idToPreviousDataObjectMap = entry.dataObjects.reduce((acc, d) => {
    const data = d as DataObjectFragment;
    acc[data.id] = data;
    return acc;
  }, {} as { [k: string]: DataObjectFragment });

  dataObjectsResults.forEach(obj => {
    if (obj.__typename === "DataObjectErrors") {
      ++failureCount;

      const {
        errors: {
          /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
          __typename,
          meta: { id },
          ...errors
        },
      } = obj;

      putDataServerErrors(
        dataStates[id as string] as DataChangedState,
        errors as DataObjectErrorFragment,
      );
    } else {
      const { dataObject } = obj;
      const { id } = dataObject;

      idToPreviousDataObjectMap[id] = {
        ...idToPreviousDataObjectMap[id],
        ...dataObject,
      };

      ++successCount;
      updateDataStateWithUpdatedDataObject(dataStates[id], dataObject);
    }
  });

  entry.dataObjects = Object.values(idToPreviousDataObjectMap);

  return [successCount, failureCount, "valid"];
}

function putDataServerErrors(
  state: DataChangedState,
  errors: DataObjectErrorFragment,
) {
  state.changed.value = "serverErrors";

  (state.changed as DataServerErrorsState).serverErrors = {
    context: { errors },
  };
}

function setEditingData(proxy: DraftState) {
  let dataChangedCount = 0;
  const { states } = proxy;

  for (const state of Object.values(states.dataStates)) {
    if (state.value === "changed") {
      ++dataChangedCount;
    }
  }

  if (dataChangedCount === 0) {
    states.editingData.value = StateValue.inactive;
  } else {
    states.editingData.value = StateValue.active;
  }
}

function handleCreateEntryOrExperienceAction(proxy: DraftState) {
  const {
    states,
    context: { entry },
  } = proxy;

  const { dataStates } = states;
  const { experienceId } = entry;
  const effects = getGeneralEffects(proxy);

  states.submission = {
    value: StateValue.submitting,
    submitting: {
      context: {
        submittedCount: 1,
      },
    },
  };

  if (isOfflineId(experienceId)) {
    effects.push({
      key: "createExperienceOnlineEffect",
      ownArgs: { dataStates },
    });

    return;
  }

  const dataObjects = entry.dataObjects.map(obj => {
    const { id, definitionId } = obj as DataObjectFragment;
    const dataState = dataStates[id];

    const {
      context: {
        defaults: { type, parsedVal },
      },
    } = dataState;

    const formValue =
      dataState.value === "changed"
        ? dataState.changed.context.formValue
        : parsedVal;

    return {
      clientId: id,
      data: makeDataObjectData(type, formValue),
      definitionId,
    };
  });

  const { updatedAt, insertedAt, clientId } = entry;

  effects.push({
    key: "createEntryOnlineEffect",
    ownArgs: {
      input: {
        dataObjects,
        clientId,
        updatedAt,
        insertedAt,
      },
    },
  });
}

///// STATE UPDATE... HELPERS

function formObjFromRawString(val: string): FormObjVal {
  const [[k, v]] = Object.entries(JSON.parse(val));
  const value = v as string;

  switch (k) {
    case "datetime":
      return parseISO(value);

    case "date":
      return parse(value, ISO_DATE_FORMAT, new Date());

    default:
      return (("" + v) as string).trim();
  }
}

function formObjToCompareString(type: DataTypes, val: FormObjVal) {
  let stringVal = val;

  if (
    !((type === DataTypes.DECIMAL || type === DataTypes.INTEGER) && val === "")
  ) {
    stringVal = formObjToString(type, val);
  }

  return [val, stringVal];
}

function getDataObjectsForOfflineUpdate(
  dataObjects: DataObjectFragment[],
  dataStates: DataStates,
  updateTime: string,
): [number, string[]] {
  let updatedCount = 0;
  const updatedDataIds: string[] = [];

  dataObjects.forEach(obj => {
    const { id } = obj;
    const d = dataStates[id];
    const dataState = d;

    if (dataState.value === "changed") {
      const {
        context: { defaults },
        changed: {
          context: { formValue },
        },
      } = dataState;

      const { type } = defaults;
      obj.data = makeDataObjectData(type, formValue);
      obj.updatedAt = updateTime;
      d.value = "unchanged";
      defaults.parsedVal = formValue;
      updatedDataIds.push(id);

      (d as DataUnchangedState).unchanged.context.anyEditSuccess = true;

      ++updatedCount;
    }
  });

  return [updatedCount, updatedDataIds];
}

function getDataObjectsForOnlineUpdate(proxy: DraftState) {
  const {
    states: { dataStates },
  } = proxy;

  const inputs: UpdateDataObjectInput[] = [];

  for (const [id, dataState] of Object.entries(dataStates)) {
    const {
      context: {
        defaults: { type },
      },
    } = dataState;

    if (dataState.value === "changed") {
      const {
        changed: {
          context: { formValue },
        },
      } = dataState;

      inputs.push({
        id,
        data: makeDataObjectData(type, formValue),
      });
    }
  }

  return [inputs];
}

function makeDataObjectData(type: DataTypes, formValue: FormObjVal) {
  return `{"${type.toLowerCase()}":"${formObjToString(type, formValue)}"}`;
}

function handleUpdateEntryOfflineAction(proxy: DraftState) {
  const {
    states,
    context: { entry },
  } = proxy;

  const updateTime = new Date().toJSON();
  entry.updatedAt = updateTime;

  const [updatedCount, updatedDataIds] = getDataObjectsForOfflineUpdate(
    entry.dataObjects as DataObjectFragment[],
    states.dataStates,
    updateTime,
  );

  const submissionSuccessResponse = {
    value: "submissionSuccess",
    submissionSuccess: {
      context: {
        validResponse: { successes: updatedCount },
      },
    },
  } as SubmissionSuccessState;

  states.submission = {
    ...states.submission,
    ...submissionSuccessResponse,
  };

  states.editingData.value = StateValue.inactive;
  const effects = getGeneralEffects(proxy);

  effects.push(
    {
      key: "updateEntryOfflineEffect",
      ownArgs: {
        entry,
        updatedDataIds,
      },
    },

    {
      key: "scrollToViewEffect",
      ownArgs: {
        id: scrollToTopId,
      },
    },
  );
}

////////////////////// END STATE UPDATE FUNCTIONS SECTION ///////////////////

export const EditEntryContext = createContext<ContextValue>({} as ContextValue);

////////////////////////// EFFECT FUNCTIONS SECTION ////////////////////////

const createEntryOnlineEffect: DefCreateEntryOnlineEffect["func"] = async (
  { input },
  { updateExperiencesOnline, persistor, cache, entry: { experienceId } },
  { dispatch },
) => {
  updateExperiencesOnlineEffectHelperFunc(
    [
      {
        experienceId,
        addEntries: [input],
      },
    ],
    updateExperiencesOnline,
    experience => {
      const { newEntries } = experience;

      if (newEntries && newEntries.length) {
        const entry0 = newEntries[0];

        // We only deal with error case because on success, onDone callback will
        // be invoked which will cause apollo to unmount this component.
        if (entry0.__typename === "CreateEntryErrors") {
          const { errors } = entry0;
          dispatch({
            type: ActionType.ON_CREATE_ENTRY_ERRORS,
            errors,
          });
        }

        return;
      }

      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error: GENERIC_SERVER_ERROR,
      });
    },
    error => dispatchCommonError(dispatch, error || GENERIC_SERVER_ERROR),
    () => {
      const { clientId, dataObjects } = input;

      wipeReferencesFromCache(
        cache,
        [makeApolloCacheRef(ENTRY_TYPE_NAME, clientId as string)].concat(
          dataObjects.map(d => {
            const dataObj = d as DataObjectFragment;

            return makeApolloCacheRef(
              DATA_OBJECT_TYPE_NAME,
              dataObj.clientId as string,
            );
          }),
        ),
      );

      persistor.persist();
    },
  );
};

type DefCreateEntryOnlineEffect = EffectDefinition<
  "createEntryOnlineEffect",
  {
    input: CreateEntryInput;
  }
>;

const createExperienceOnlineEffect: DefCreateExperienceOnlineEffect["func"] = (
  { dataStates },
  props,
  effectArgs,
) => {
  const {
    experience,
    entry: { id: entryId, dataObjects },
    experienceDispatch,
  } = props;

  const { dispatch } = effectArgs;

  const updatedDataObjects: DataObjectFragment[] = dataObjects.map(obj => {
    const { id, ...rest } = obj as DataObjectFragment;
    const dataState = dataStates[id];

    const {
      context: {
        defaults: { type, parsedVal },
      },
    } = dataState;

    const formValue =
      dataState.value === "changed"
        ? dataState.changed.context.formValue
        : parsedVal;

    return {
      ...rest,
      id,
      clientId: id,
      data: makeDataObjectData(type, formValue),
    } as DataObjectFragment;
  });

  const updatedExperience = immer(experience, proxy => {
    const edges = proxy.entries.edges as EntryConnectionFragment_edges[];

    for (let index = 0; index < edges.length; index++) {
      const edge = edges[index] as EntryConnectionFragment_edges;
      const node = edge.node as EntryFragment;

      if (node.id === entryId) {
        node.dataObjects = updatedDataObjects;
        break;
      }
    }
  });

  experienceDispatch({
    type: ExperienceActionType.SYNC_EDITED_OFFLINE_EXPERIENCE,
    experience: updatedExperience,
    onError: error => {
      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error,
      });
    },
  });
};

type DefCreateExperienceOnlineEffect = EffectDefinition<
  "createExperienceOnlineEffect",
  {
    dataStates: DataStates;
  }
>;

const updateEntryOfflineEffect: DefUpdateEntryOfflineEffect["func"] = async (
  { entry, updatedDataIds },
  props,
) => {
  const { experienceId, id: entryId } = entry;
  const { client, persistor } = props;

  (await upsertExperienceWithEntry(
    client,
    entry,
    experienceId,
  )) as ExperienceFragment;

  if (!isOfflineId(experienceId)) {
    const unsyncedExperience = (getUnsyncedExperience(experienceId) ||
      {}) as UnsyncedModifiedExperience;

    const unsyncedModifiedEntries = unsyncedExperience.modifiedEntries || {};
    const unsyncedModifiedEntry = unsyncedModifiedEntries[entryId] || {};
    unsyncedModifiedEntries[entryId] = unsyncedModifiedEntry;
    unsyncedExperience.modifiedEntries = unsyncedModifiedEntries;

    updatedDataIds.forEach(id => {
      unsyncedModifiedEntry[id] = true;
    });

    writeUnsyncedExperience(experienceId, unsyncedExperience);
  }

  await persistor.persist();
};

type DefUpdateEntryOfflineEffect = EffectDefinition<
  "updateEntryOfflineEffect",
  {
    entry: EntryFragment;
    updatedDataIds: string[];
  }
>;

const updateEntryOnlineEffect: DefUpdateEntryOnlineEffect["func"] = async (
  { dataInput },
  props,
  effectArgs,
) => {
  const {
    entry: { id: entryId, experienceId },
    updateExperiencesOnline,
  } = props;

  const { dispatch } = effectArgs;

  const input = {
    experienceId,
    updateEntries: [
      {
        entryId,
        dataObjects: dataInput,
      },
    ],
  };

  updateExperiencesOnlineEffectHelperFunc(
    [input],
    updateExperiencesOnline,
    experience => {
      const { updatedEntries } = experience;

      if (updatedEntries && updatedEntries.length) {
        const updatedEntry0 = updatedEntries[0];

        if (updatedEntry0.__typename === "UpdateEntryErrors") {
          dispatchCommonError(dispatch, updatedEntry0.errors.error);
        } else {
          const {
            entry: { dataObjects },
          } = updatedEntry0;

          dispatch({
            type: ActionType.UPDATE_ENTRY_ONLINE_RESPONSE,
            dataObjects,
          });
        }

        return;
      }

      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error: GENERIC_SERVER_ERROR,
      });
    },
    error => dispatchCommonError(dispatch, error || GENERIC_SERVER_ERROR),
  );
};

type DefUpdateEntryOnlineEffect = EffectDefinition<
  "updateEntryOnlineEffect",
  {
    dataInput: UpdateDataObjectInput[];
  }
>;

const scrollToViewEffect: ScrollToViewEffect["func"] = ({ id }) => {
  scrollIntoView(id, {
    behavior: "smooth",
  });
};

type ScrollToViewEffect = EffectDefinition<
  "scrollToViewEffect",
  {
    id: string;
  }
>;

export const effectFunctions = {
  updateEntryOnlineEffect,
  createEntryOnlineEffect,
  updateEntryOfflineEffect,
  scrollToViewEffect,
  createExperienceOnlineEffect,
};

function dispatchCommonError(dispatch: DispatchType, error: CommonError) {
  dispatch({
    type: ActionType.ON_COMMON_ERROR,
    error,
  });
}

////////////////////////// END EFFECT FUNCTIONS SECTION /////////////////

/////////////////// STATE UPDATE FUNCTIONS SECTION /////////////

////////////////////////// TYPES SECTION ////////////////////////

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly context: {
    readonly entry: EntryFragment;
    readonly hasConnection: LayoutContextValue["hasConnection"];
  };
  readonly effects: {
    general: EffectState | { value: NoEffectVal };
  };
  states: {
    readonly mode: { value: OfflineVal } | { value: OnlineVal };
    readonly dataStates: DataStates;
    readonly editingData: {
      value: ActiveVal | InActiveVal;
    };
    readonly submission: Submission;
  };
}

////////////////////////// STRINGY TYPES SECTION //////////////////////
type NoEffectVal = "noEffect";
type HasEffectsVal = "hasEffects";
type InActiveVal = "inactive";
type SingleVal = "single";
type MultipleVal = "multiple";
type ActiveVal = "active";
type SubmittingVal = "submitting";
type ApolloErrorValue = "apolloErrors";
type OtherErrorsVal = "otherErrors";
type OnlineVal = "online";
type OfflineVal = "offline";
////////////////////////// END STRINGY TYPES SECTION //////////////////

interface ContextValue {
  dispatch: DispatchType;
  onSubmit: () => void;
  hasConnection: LayoutContextValue["hasConnection"];
}

interface GeneralEffectState<IEffect> {
  run: boolean;
  effect: IEffect;
}

interface EffectState {
  value: HasEffectsVal;
  hasEffects: {
    context: {
      effects: EffectsList;
    };
  };
}

type EffectsList = (
  | DefCreateEntryOnlineEffect
  | DefUpdateEntryOnlineEffect
  | DefUpdateEntryOfflineEffect
  | ScrollToViewEffect
  | DefCreateExperienceOnlineEffect
)[];

export interface EffectArgs {
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
    effectArgs: Props,
    lastArgs: EffectArgs,
  ) => void | Promise<void | (() => void)> | (() => void);
}

interface Submitting {
  value: SubmittingVal;
  submitting: {
    context: {
      submittedCount: number;
    };
  };
}

export type Submission =
  | {
      value: InActiveVal;
    }
  | Submitting
  | (
      | {
          value: ApolloErrorValue;
          apolloErrors: {
            context: {
              errors: string;
            };
          };
        }
      | SubmissionSuccessState
      | {
          value: OtherErrorsVal;
          otherErrors: {
            context: {
              errors: string;
            };
          };
        }
      | SubmissionFormErrors
    );

interface SubmissionFormErrors {
  value: "formErrors";

  formErrors: {
    context: {
      errors: string;
    };
  };
}

interface SubmissionSuccessState {
  value: "submissionSuccess";

  submissionSuccess: {
    context: SubmissionSuccessStateContext;
  };
}

interface SubmissionSuccessStateContext {
  validResponse?: {
    successes: number;
    failures: number;
  };

  invalidResponse?: SubmissionInvalidResponse;
}

interface SubmissionInvalidResponse {
  data?: string;
  definitions?: string;
  entry?: string;
}

export type Action =
  | ({
      type: ActionType.ON_COMMON_ERROR;
    } & CommonErrorPayload)
  | ({
      type: ActionType.ON_CREATE_ENTRY_ERRORS;
    } & CreateOnlineEntryErrorPayload)
  | ({
      type: ActionType.SUBMITTING;
    } & SubmittingPayload)
  | {
      type: ActionType.DESTROYED;
    }
  | ({
      type: ActionType.DATA_CHANGED;
    } & DataChangedPayload)
  | {
      type: ActionType.DISMISS_SUBMISSION_RESPONSE_MESSAGE;
    }
  | ({
      type: ActionType.UPDATE_ENTRY_ONLINE_RESPONSE;
    } & UpdateDataObjectsOnlineSubmissionResponsePayload);

interface UpdateDataObjectsOnlineSubmissionResponsePayload {
  dataObjects: UpdateEntryFragment_dataObjects[];
}

interface SubmittingPayload {
  hasConnection: LayoutContextValue["hasConnection"];
}

interface CreateOnlineEntryErrorPayload {
  errors: CreateEntryErrorFragment;
}

interface DataChangedPayload {
  id: string;
  rawFormVal: FormObjVal;
}

export type Props = UpdateExperiencesOnlineComponentProps &
  CallerProps & {
    client: ApolloClient<{}>;
    persistor: AppPersistor;
    cache: InMemoryCache;
    layoutDispatch: LayoutDispatchType;
    hasConnection: LayoutContextValue["hasConnection"];
    experienceDispatch: ExperienceDispatchType;
  };

export interface CallerProps {
  entry: EntryFragment;
  experience: ExperienceFragment;
  entryDispatch: EntryDispatchType;
}

export type DispatchType = Dispatch<Action>;

interface IdString {
  id: string;
}

export interface DataStates {
  [k: string]: DataState;
}

export type DataState = {
  context: {
    defaults: DataObjectFragment & {
      parsedVal: FormObjVal;
      type: DataTypes;
      definitionName: string;
    };
  };
} & (DataUnchangedState | DataChangedState);

interface DataUnchangedState {
  value: "unchanged";
  unchanged: {
    context: {
      anyEditSuccess?: true;
    };
  };
}

interface DataChangedState {
  value: "changed";

  changed: {
    context: {
      formValue: FormObjVal;
      formValueString: string;
    };
  } & (
    | {
        value: "normal";
      }
    | {
        value: "formErrors";
        context: {
          errors: {};
        };
      }
    | DataServerErrorsState
  );
}

interface DataServerErrorsState {
  value: "serverErrors";
  serverErrors: {
    context: {
      errors: DataObjectErrorFragment;
    };
  };
}
