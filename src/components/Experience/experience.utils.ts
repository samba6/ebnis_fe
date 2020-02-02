import dateFnFormat from "date-fns/format";
import parseISO from "date-fns/parseISO";
import {
  DataTypes,
  UpdateExperienceOwnFieldsInput,
  UpdateDefinitionInput,
  CreateExperienceInput,
  CreateEntryInput,
} from "../../graphql/apollo-types/globalTypes";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges,
} from "../../graphql/apollo-types/ExperienceFragment";
import { EbnisComponentProps } from "../../types";
import { Reducer, Dispatch } from "react";
import immer, { Draft } from "immer";
import { wrapReducer } from "../../logger";
import {
  CreateExperiencesComponentProps,
  UpdateExperiencesOnlineComponentProps,
} from "../../graphql/update-experience.mutation";
import { UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences } from "../../graphql/apollo-types/UpdateExperiencesOnline";
import {
  getUnsyncedExperience,
  removeUnsyncedExperience,
} from "../../apollo-cache/unsynced.resolvers";
import { UpdateAnExperienceInput } from "../../graphql/apollo-types/globalTypes";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import ApolloClient, { ApolloError } from "apollo-client";
import { updateExperiencesInCache } from "../../apollo-cache/update-experiences";
import { CreateEntriesMutationProps } from "../../graphql/create-entries.mutation";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { EntryConnectionFragment_edges } from "../../graphql/apollo-types/EntryConnectionFragment";
import { entriesPaginationVariables } from "../../graphql/get-experience-full.query";
import { CreateExperiences_createExperiences_CreateExperienceErrorss_errors } from "../../graphql/apollo-types/CreateExperiences";
import { createExperiencesManualUpdate } from "../../apollo-cache/create_experiences-update";
import { AppPersistor } from "../../context";
import { InMemoryCache } from "apollo-cache-inmemory";
import { parseStringError, StringyErrorPayload } from "../../general-utils";
import { saveOnSyncOfflineExperienceComponentSuccess } from "../../apollo-cache/on-sync-offline-experience-component-success";

export const StateValue = {
  success: "success" as SuccessVal,
  errors: "errors" as ErrorsVal,
  inactive: "inactive" as InActiveVal,
  active: "active" as ActiveVal,
  editing: "editing" as EditingVal,
  idle: "idle" as IdleVal,
  noEffect: "noEffect" as NoEffectVal,
  hasEffects: "hasEffects" as HasEffectsVal,
  warning: "warning" as WarningVal,
  submitting: "submitting" as SubmittingVal,
};

export const displayFieldType = {
  [DataTypes.SINGLE_LINE_TEXT](text: string) {
    return text;
  },

  [DataTypes.MULTI_LINE_TEXT](text: string) {
    return text;
  },

  [DataTypes.DATE](text: string) {
    return dateFnFormat(new Date(text), "dd/MM/yyyy");
  },

  [DataTypes.DATETIME](text: string) {
    const date = parseISO(text);

    return formatDatetime(date);
  },

  [DataTypes.DECIMAL](text: string) {
    return Number(text);
  },

  [DataTypes.INTEGER](text: string) {
    return Number(text);
  },
};

export enum ActionType {
  EDIT_EXPERIENCE = "@experience-component/edit-experience",
  SYNC = "@eperience-component/sync",
  CLOSE_SUBMIT_NOTIFICATION = "@eperience-component/close-submit-notification",
  ON_MODIFIED_EXPERIENCE_SYNCED = "@experience-component/on-modified-experience-synced",
  ON_SYNC_OFFLINE_EXPERIENCE_ERRORS = "@experience-component/on-sync-offline-experience-errors",
  ON_SYNC_OFFLINE_EXPERIENCE_SUCCESS = "@experience-component/on-sync-offline-experience-success",
  ABORTED = "@experience-component/edit-cancelled",
  COMPLETED = "@experience-component/edit-finished",
  SYNC_EDITED_OFFLINE_EXPERIENCE = "@experience-component/sync-edited-offline-experience",
  ON_COMMON_ERROR = "@experience-component/on-common-error",
  SET_OFFLINE_EXPERIENCE_NEWLY_SYNCED = "@experience-component/offline-experience-newly-synced",
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
          case ActionType.COMPLETED:
          case ActionType.ABORTED:
            proxy.states.editExperience.value = StateValue.idle;
            break;

          case ActionType.EDIT_EXPERIENCE:
            handleEditExperienceAction(proxy);
            break;

          case ActionType.SYNC:
            handleSyncAction(proxy);
            break;

          case ActionType.CLOSE_SUBMIT_NOTIFICATION:
            handleCloseSubmitNotificationAction(proxy);
            break;

          case ActionType.ON_MODIFIED_EXPERIENCE_SYNCED:
            handleOnModifiedExperienceSyncedAction(
              proxy,
              payload as OnModifiedExperienceSyncedPayload,
            );
            break;

          case ActionType.ON_SYNC_OFFLINE_EXPERIENCE_ERRORS:
            handleOnSyncOfflineExperienceErrorsAction(
              proxy,
              payload as OnSyncOfflineExperienceErrorsPayload,
            );
            break;

          case ActionType.ON_SYNC_OFFLINE_EXPERIENCE_SUCCESS:
            handleOnSyncOfflineExperienceSuccessAction(
              proxy,
              payload as OnSyncOfflineExperienceSuccessPayload,
            );
            break;

          case ActionType.ON_COMMON_ERROR:
            handleOnCommonErrorAction(proxy, payload as StringyErrorPayload);
            break;

          case ActionType.SYNC_EDITED_OFFLINE_EXPERIENCE:
            handleSyncEditedOfflineExperienceAction(
              proxy,
              payload as SyncEditedOfflineExperiencePayload,
            );
            break;

          case ActionType.SET_OFFLINE_EXPERIENCE_NEWLY_SYNCED:
            proxy.context.offlineExperienceNewlySynced = (payload as SetOfflineExperienceNewlySyncedPayload).value;
            break;
        }
      });
    },

    // true
  );
////////////////////////// EFFECTS SECTION /////////////////////////

export const GENERIC_SERVER_ERROR = "Something went wrong - please try again.";

const syncEffect: SyncEffectDef["func"] = async (_, props, effectArgs) => {
  if (effectArgs.isOffline) {
    syncOfflineExperienceEffectHelper(props, effectArgs);
    return;
  }

  const { dispatch } = effectArgs;
  const { updateExperiencesOnline, experience } = props;
  const { id: experienceId } = experience;
  const unsynced = getUnsyncedExperience(experienceId);

  // throw "Please remove from unsynced in local storage on all success";

  if (!unsynced) {
    dispatch({
      type: ActionType.ON_COMMON_ERROR,
      error: GENERIC_SERVER_ERROR,
    });

    return;
  }

  const input = {
    experienceId,
  } as UpdateAnExperienceInput;

  const { ownFields, definitions: unSyncedDefinitions } = unsynced;

  if (ownFields) {
    const ownFieldsInput = {} as UpdateExperienceOwnFieldsInput;
    input.ownFields = ownFieldsInput;

    Object.keys(ownFields).forEach(k => {
      ownFieldsInput[k] = experience[k];
    });
  }

  if (unSyncedDefinitions) {
    const definitionsInput = [] as UpdateDefinitionInput[];
    input.updateDefinitions = definitionsInput;

    experience.dataDefinitions.forEach(d => {
      const definition = d as DataDefinitionFragment;
      const { id } = definition;
      const unsyncedDef = unSyncedDefinitions[id];

      if (!unsyncedDef) {
        return;
      }

      const definitionInput = { id } as UpdateDefinitionInput;
      definitionsInput.push(definitionInput);

      Object.keys(unsyncedDef).forEach(k => {
        definitionInput[k] = definition[k];
      });
    });
  }

  try {
    const response = await updateExperiencesOnline({
      variables: {
        input: [input],
      },
      update: updateExperiencesInCache,
    });

    const validResponse =
      response && response.data && response.data.updateExperiences;

    if (!validResponse) {
      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error: GENERIC_SERVER_ERROR,
      });

      return;
    }

    switch (validResponse.__typename) {
      case "UpdateExperiencesAllFail":
        dispatch({
          type: ActionType.ON_COMMON_ERROR,
          error: validResponse.error,
        });

        break;

      case "UpdateExperiencesSomeSuccess":
        {
          dispatch({
            type: ActionType.ON_MODIFIED_EXPERIENCE_SYNCED,
            syncResult: validResponse.experiences[0],
          });
        }
        break;
    }
  } catch (error) {
    dispatch({
      type: ActionType.ON_COMMON_ERROR,
      error,
    });
  }
};

type SyncEffectDef = EffectDefinition<"syncEffect">;

export const OFFLINE_EXPERIENCE_SYNCED_NAVIGATION_STATE_KEY =
  "@experience-componnet/offline-experience-synced";

const onSyncOfflineExperienceSuccessEffect: DefOnSyncExperienceSuccessEffect["func"] = async (
  { syncedId, unsyncedIds },
  props,
) => {
  await props.persistor.persist();
  saveOnSyncOfflineExperienceComponentSuccess(unsyncedIds.concat(syncedId));
};

type DefOnSyncExperienceSuccessEffect = EffectDefinition<
  "onSyncOfflineExperienceSuccessEffect",
  { syncedId: string; unsyncedIds: string[] }
>;

const syncEditedOfflineExperienceEffect: DefSyncOfflineEditedExperienceEffect["func"] = (
  editedOfflineArgs,
  props,
  effectArgs,
) => {
  syncOfflineExperienceEffectHelper(props, effectArgs, editedOfflineArgs);
};

export type DefSyncOfflineEditedExperienceEffect = EffectDefinition<
  "syncEditedOfflineExperienceEffect",
  SyncEditedOfflineExperiencePayload
>;

export const effectFunctions = {
  syncEffect,
  onSyncOfflineExperienceSuccessEffect,
  syncEditedOfflineExperienceEffect,
};

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

async function syncOfflineExperienceEffectHelper(
  props: Props,
  effectArgs: EffectArgs,
  editedOffline?: SyncEditedOfflineExperiencePayload,
) {
  const { dispatch } = effectArgs;
  const onError = editedOffline && editedOffline.onError;

  try {
    let experience = props.experience;

    if (editedOffline) {
      experience = editedOffline.experience;
    }

    const { createExperiences } = props;
    const { entries, id: unsyncedId } = experience;

    let unsyncedIds: string[] = [unsyncedId];

    const input = {
      title: experience.title,
      clientId: experience.clientId,
      dataDefinitions: experience.dataDefinitions.map(
        definitionToUploadDataEffectHelper,
      ),
      insertedAt: experience.insertedAt,
      updatedAt: experience.updatedAt,
      description: experience.description,
    } as CreateExperienceInput;

    const edges = entries.edges as ExperienceFragment_entries_edges[];
    const entriesUnsyncedIds = offlinePrepareOfflineEntriesForSyncEffectHelper(
      edges,
    );

    input.entries = entriesUnsyncedIds[0];
    unsyncedIds = unsyncedIds.concat(entriesUnsyncedIds[1]);

    const response = await createExperiences({
      variables: {
        input: [input],
        ...entriesPaginationVariables,
      },
      update: createExperiencesManualUpdate,
    });

    const validResponses =
      response &&
      response.data &&
      response.data.createExperiences &&
      response.data.createExperiences[0];

    if (!validResponses) {
      if (onError) {
        onError(GENERIC_SERVER_ERROR);
        return;
      }

      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error: GENERIC_SERVER_ERROR,
      });

      return;
    }

    switch (validResponses.__typename) {
      case "CreateExperienceErrorss":
        if (onError) {
          onError(GENERIC_SERVER_ERROR);
          return;
        }

        dispatch({
          type: ActionType.ON_SYNC_OFFLINE_EXPERIENCE_ERRORS,
          errors: validResponses.errors,
        });
        break;

      case "ExperienceSuccess":
        {
          const { experience, entriesErrors } = validResponses;

          if (entriesErrors) {
            const error = JSON.stringify(entriesErrors);

            if (onError) {
              onError(error);
              return;
            }

            dispatch({
              type: ActionType.ON_COMMON_ERROR,
              error,
            });

            return;
          }

          const { id } = experience;

          removeUnsyncedExperience(unsyncedId);

          dispatch({
            type: ActionType.ON_SYNC_OFFLINE_EXPERIENCE_SUCCESS,
            data: {
              unsyncedIds,
              syncedId: id,
            },
          });
        }
        break;
    }
  } catch (error) {
    if (onError) {
      onError(error);
      return;
    }

    dispatch({
      type: ActionType.ON_COMMON_ERROR,
      error,
    });
  }
}

const UploadableDataObjectKeys: (keyof DataObjectFragment)[] = [
  "data",
  "definitionId",
  "clientId",
  "insertedAt",
  "updatedAt",
];

function offlinePrepareOfflineEntriesForSyncEffectHelper(
  edges: (EntryConnectionFragment_edges | null)[],
) {
  return edges.reduce(
    ([entries, unsyncedIds], edge) => {
      const entry = (edge as EntryConnectionFragment_edges)
        .node as EntryFragment;

      const dataObjects = entry.dataObjects.map(value => {
        const dataObject = value as DataObjectFragment;

        return UploadableDataObjectKeys.reduce((acc, k) => {
          acc[k as keyof DataObjectFragment] =
            dataObject[k as keyof DataObjectFragment];
          return acc;
        }, {} as DataObjectFragment);
      });

      entries.push({
        experienceId: entry.experienceId,
        clientId: entry.clientId as string,
        dataObjects,
        insertedAt: entry.insertedAt,
        updatedAt: entry.updatedAt,
      });

      unsyncedIds.push(entry.id);

      return [entries, unsyncedIds] as [CreateEntryInput[], string[]];
    },
    [[], []] as [CreateEntryInput[], string[]],
  );
}

function definitionToUploadDataEffectHelper(
  value: DataDefinitionFragment | null,
) {
  const { clientId, name, type } = value as DataDefinitionFragment;
  return { clientId, name, type };
}

////////////////////////// END EFFECTS SECTION /////////////////////////

////////////////////////// STATE UPDATE SECTION /////////////////////
export function initState(): StateMachine {
  return {
    context: {},
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
    states: {
      submission: { value: StateValue.inactive },
      editExperience: { value: StateValue.idle },
    },
  };
}

function handleSyncAction(proxy: DraftState) {
  proxy.states.submission.value = StateValue.submitting;

  const effects = getGeneralEffects(proxy);
  effects.push({
    key: "syncEffect",
    ownArgs: {},
  });
}

function handleOtherErrorsAction(
  proxy: DraftState,
  payload: OtherErrorsPayload,
) {
  const { states } = proxy;
  const submissionState = states.submission as SubmissionErrors;
  submissionState.value = StateValue.errors;
  submissionState.errors = {
    context: {
      errors: payload.errors,
    },
  };
}

function handleOnModifiedExperienceSyncedAction(
  proxy: DraftState,
  payload: OnModifiedExperienceSyncedPayload,
) {
  const { syncResult } = payload;

  switch (syncResult.__typename) {
    case "UpdateExperienceFullErrors":
      {
        const {
          errors: { error },
        } = syncResult;

        handleOtherErrorsAction(proxy, { errors: error });
      }
      break;

    case "UpdateExperienceSomeSuccess": {
      const { experience } = syncResult;
      const { ownFields, updatedDefinitions } = experience;

      if (!(ownFields || updatedDefinitions)) {
        handleOtherErrorsAction(proxy, { errors: GENERIC_SERVER_ERROR });
      } else {
        proxy.states.submission.value = StateValue.success;
      }
    }
  }
}

function handleOnSyncOfflineExperienceErrorsAction(
  proxy: DraftState,
  payload: OnSyncOfflineExperienceErrorsPayload,
) {
  const {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
    errors: { meta, ...errors },
  } = payload;

  handleOtherErrorsAction(proxy, { errors: JSON.stringify(errors) });
}

function handleOnSyncOfflineExperienceSuccessAction(
  proxy: DraftState,
  payload: OnSyncOfflineExperienceSuccessPayload,
) {
  proxy.states.submission.value = StateValue.inactive;

  const effects = getGeneralEffects(proxy);
  effects.push({
    key: "onSyncOfflineExperienceSuccessEffect",
    ownArgs: payload.data,
  });
}

function handleCloseSubmitNotificationAction(proxy: DraftState) {
  const { context, states } = proxy;
  states.submission.value = StateValue.inactive;
  context.offlineExperienceNewlySynced = false;
}

function handleOnCommonErrorAction(
  proxy: DraftState,
  payload: StringyErrorPayload,
) {
  const { states } = proxy;
  const submissionState = states.submission as SubmissionErrors;
  submissionState.value = StateValue.errors;
  submissionState.errors = {
    context: {
      errors: parseStringError(payload.error),
    },
  };
}

function handleSyncEditedOfflineExperienceAction(
  proxy: DraftState,
  payload: SyncEditedOfflineExperiencePayload,
) {
  const effects = getGeneralEffects(proxy);
  effects.push({
    key: "syncEditedOfflineExperienceEffect",
    ownArgs: payload,
  });
}

function handleEditExperienceAction(proxy: DraftState) {
  const { states } = proxy;
  const editExperience = states.editExperience;
  editExperience.value = StateValue.editing;
}

////////////////////////// END STATE UPDATE SECTION /////////////////

export function formatDatetime(date: Date | string) {
  date = typeof date === "string" ? parseISO(date) : date;
  return dateFnFormat(date, "dd/MM/yyyy HH:mm:ss");
}

////////////////////////// TYPES SECTION ///////////////////////

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly context: {
    readonly offlineExperienceNewlySynced?: boolean;
  };
  readonly states: {
    readonly editExperience: { value: IdleVal } | { value: EditingVal };
    readonly submission: Submission;
  };
  readonly effects: {
    general: EffectState | { value: NoEffectVal };
  };
}

// interface SyncEditedOfflineExperienceState {
//   value: ActiveVal;
//   active: {}
// }

////////////////////////// STRINGY TYPES SECTION /////////////////////////
type EditingVal = "editing";
type IdleVal = "idle";
type NoEffectVal = "noEffect";
type HasEffectsVal = "hasEffects";
type InActiveVal = "inactive";
type ActiveVal = "active";
type SubmittingVal = "submitting";
type SuccessVal = "success";
type ErrorsVal = "errors";
type WarningVal = "warning";
////////////////////////// END STRINGY TYPES SECTION ////////////////////

interface Submitting {
  value: SubmittingVal;
}

type Submission =
  | {
      value: InActiveVal;
    }
  | Submitting
  | SubmissionSuccess
  | SubmissionErrors
  | SubmissionWarning;

interface SubmissionSuccess {
  value: SuccessVal;
}

interface SubmissionErrors {
  value: ErrorsVal;
  errors: {
    context: {
      errors: string;
    };
  };
}

interface SubmissionWarning {
  value: WarningVal;
  warning: {
    context: {
      warning: string;
    };
  };
}

interface SetOfflineExperienceNewlySyncedPayload {
  value: boolean;
}

type Action =
  | ({
      type: ActionType.SET_OFFLINE_EXPERIENCE_NEWLY_SYNCED;
    } & SetOfflineExperienceNewlySyncedPayload)
  | ({
      type: ActionType.ON_COMMON_ERROR;
    } & StringyErrorPayload)
  | ({
      type: ActionType.SYNC_EDITED_OFFLINE_EXPERIENCE;
    } & SyncEditedOfflineExperiencePayload)
  | {
      type: ActionType.COMPLETED;
    }
  | {
      type: ActionType.ABORTED;
    }
  | {
      type: ActionType.CLOSE_SUBMIT_NOTIFICATION;
    }
  | {
      type: ActionType.EDIT_EXPERIENCE;
    }
  | {
      type: ActionType.SYNC;
    }
  | ({
      type: ActionType.ON_MODIFIED_EXPERIENCE_SYNCED;
    } & OnModifiedExperienceSyncedPayload)
  | ({
      type: ActionType.ON_SYNC_OFFLINE_EXPERIENCE_ERRORS;
    } & OnSyncOfflineExperienceErrorsPayload)
  | ({
      type: ActionType.ON_SYNC_OFFLINE_EXPERIENCE_SUCCESS;
    } & OnSyncOfflineExperienceSuccessPayload);

interface SyncEditedOfflineExperiencePayload {
  experience: ExperienceFragment;
  onError: (error: string) => void;
}

interface OnSyncOfflineExperienceSuccessPayload {
  data: DefOnSyncExperienceSuccessEffect["ownArgs"];
}

interface OnSyncOfflineExperienceErrorsPayload {
  errors: CreateExperiences_createExperiences_CreateExperienceErrorss_errors;
}

interface OnModifiedExperienceSyncedPayload {
  syncResult: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences;
}

interface ApolloErrorsPayload {
  errors: ApolloError;
}

interface OtherErrorsPayload {
  errors: string;
}

export type DispatchType = Dispatch<Action>;

export interface IMenuOptions {
  newEntry?: boolean;
  onDelete: (id: string) => void;
}

export interface CallerProps extends EbnisComponentProps {
  experience: ExperienceFragment;
  entryProps?: EbnisComponentProps;
  headerProps?: EbnisComponentProps;
  menuOptions: IMenuOptions;
  entriesJSX?: JSX.Element | JSX.Element[];
}

export type Props = CallerProps &
  CreateEntriesMutationProps &
  UpdateExperiencesOnlineComponentProps &
  CreateExperiencesComponentProps & {
    hasConnection: boolean;
    client: ApolloClient<{}>;
    persistor: AppPersistor;
    cache: InMemoryCache;
    pathname: string;
  };

export type FormObjVal = number | Date | string;
export interface FormObj {
  [k: string]: FormObjVal;
}

export interface FieldComponentProps {
  name: string;
  onChange: (formName: string, value: FormObjVal) => void;
}

export interface EffectArgs {
  dispatch: DispatchType;
  isOffline: boolean;
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

export interface EffectState {
  value: HasEffectsVal;
  hasEffects: {
    context: {
      effects: EffectsList;
    };
  };
}

type EffectsList = (
  | DefSyncOfflineEditedExperienceEffect
  | SyncEffectDef
  | DefOnSyncExperienceSuccessEffect
)[];
