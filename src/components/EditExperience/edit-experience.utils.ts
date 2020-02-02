import { ExperienceNoEntryFragment } from "../../graphql/apollo-types/ExperienceNoEntryFragment";
import { UpdateExperiencesOnlineComponentProps } from "../../graphql/update-experience.mutation";
import { Dispatch, Reducer } from "react";
import { UpdateExperienceMutation_updateExperience_errors } from "../../graphql/apollo-types/UpdateExperienceMutation";
import { wrapReducer } from "../../logger";
import immer, { Draft } from "immer";
import {
  UpdateExperienceOwnFieldsInput,
  UpdateDefinitionInput,
  UpdateAnExperienceInput,
  DataTypes,
} from "../../graphql/apollo-types/globalTypes";
import { UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences } from "../../graphql/apollo-types/UpdateExperiencesOnline";
import ApolloClient from "apollo-client";
import { updateExperiencesInCache } from "../../apollo-cache/update-experiences";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { UpdateExperienceOwnFieldsUnionFragment } from "../../graphql/apollo-types/UpdateExperienceOwnFieldsUnionFragment";
import { UpdateDefinitionUnionFragment } from "../../graphql/apollo-types/UpdateDefinitionUnionFragment";
import { scrollIntoView } from "../scroll-into-view";
import { scrollToTopId } from "./edit-experience.dom";
import { AppPersistor } from "../../context";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
  UpdateExperienceOfflineComponentProps,
  UpdateExperienceOffline,
} from "./edit-experience.resolvers";
import {
  DispatchType as ExperienceDispatchType,
  ActionType as ExperienceActype,
} from "../Experience/experience.utils";
import { parseStringError, StringyErrorPayload } from "../../general-utils";
import { isOfflineId } from "../../constants";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";

export enum ActionType {
  SUBMITTING = "@edit-experience/submitting",
  FORM_ERRORS = "@edit-experience/form-errors",
  SERVER_ERRORS = "@edit-experience/server-errors",
  FORM_CHANGED = "@edit-experience/form-changed",
  ON_UPDATED_ONLINE = "@edit-experience/on-updated-online",
  ON_UPDATED_OFFLINE = "@edit-experience/on-updated-offline",
  RESET_FORM_FIELDS = "@edit-experience/reset-form-fields",
  CLOSE_SUBMIT_NOTIFICATION = "@edit-experience/close-submit-notification",
  SERVER_FIELD_ERRORS = "@edit-experience/server-field-errors",
  DEFINITION_CHANGED = "@edit-experience/definition-changed",
  ON_COMMON_ERROR = "@edit-experience/on-common-error",
}

export const StateValue = {
  warning: "warning" as WarningVal,
  active: "active" as ActiveVal,
  inactive: "inactive" as InActiveVal,
  submitting: "submitting" as SubmittingVal,
  unchanged: "unchanged" as UnChangedVal,
  changed: "changed" as ChangedVal,
  noEffect: "noEffect" as NoEffectVal,
  hasEffects: "hasEffects" as HasEffectsVal,
  valid: "valid" as ValidVal,
  invalid: "invalid" as InvalidVal,
  initial: "initial" as InitialVal,
  success: "success" as SuccessVal,
  errors: "errors" as ErrorsVal,
};

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.general.value = StateValue.noEffect;
        delete proxy.effects.general[StateValue.hasEffects];

        switch (type) {
          case ActionType.FORM_CHANGED:
            handleFormChangedAction(proxy, payload as FormChangedPayload);
            break;

          case ActionType.DEFINITION_CHANGED:
            handleDefinitionChangedAction(
              proxy,
              payload as DefinitionChangedPayload,
            );
            break;

          case ActionType.SUBMITTING:
            handleSubmittingAction(proxy);
            break;

          case ActionType.ON_UPDATED_ONLINE:
            handleOnUpdatedOnlineAction(proxy, payload as OnUpdatedPayload);
            break;

          case ActionType.RESET_FORM_FIELDS:
            handleResetFormFieldsAction(proxy);
            break;

          case ActionType.CLOSE_SUBMIT_NOTIFICATION:
            proxy.states.submission.value = StateValue.inactive;
            break;

          case ActionType.ON_UPDATED_OFFLINE:
            handleOnUpdatedOfflineAction(
              proxy,
              payload as OnUpdatedOfflinePayload,
            );
            break;

          case ActionType.ON_COMMON_ERROR:
            handleOnCommonErrorAction(proxy, payload as StringyErrorPayload);
            break;
        }
      });
    },
    // true,
  );

////////////////////////// EFFECTS SECTION /////////////////////////

export const GENERIC_SERVER_ERROR = "Something went wrong - please try again.";
export const FORM_CONTAINS_ERRORS_MESSAGE =
  "Form contains errors. Please correct them and save again.";

const submitEffect: DefSubmitEffect["func"] = async (
  { input },
  props,
  effectArgs,
) => {
  const {
    hasConnection,
    updateExperienceOffline,
    updateExperiencesOnline,
    experience,
  } = props;
  const { dispatch } = effectArgs;
  const { id: experienceId } = experience;

  const updateData = {
    experienceId,
    ...input,
  };

  if (!hasConnection) {
    const result = await updateExperienceOffline({
      variables: {
        input: updateData,
      },
    });

    const validResponse =
      result && result.data && result.data.updateExperienceOffline;

    dispatch({
      type: ActionType.ON_UPDATED_OFFLINE,
      result: validResponse,
    });

    return;
  }

  if (isOfflineId(experienceId)) {
    SyncEditedOfflineExperienceEffectHelper(input, props, effectArgs);
    return;
  }

  try {
    const result = await updateExperiencesOnline({
      variables: {
        input: [updateData],
      },
      update: updateExperiencesInCache,
    });

    const validResponse =
      result && result.data && result.data.updateExperiences;

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
          const updateResult = validResponse.experiences[0];
          onExperienceUpdatedEffectHelper(updateResult, props, effectArgs);
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

type DefSubmitEffect = EffectDefinition<
  "submitEffect",
  {
    input: FormInput;
  }
>;

interface DefinitionUpdateVal {
  name: string;
  updatedAt?: string;
}

function SyncEditedOfflineExperienceEffectHelper(
  input: FormInput,
  props: Props,
  effectArgs: EffectArgs,
) {
  const { parentDispatch, experience } = props;
  const { dispatch } = effectArgs;

  const { ownFields, updateDefinitions: definitionsInput } = input;

  const updatedExperience = immer(experience, proxy => {
    proxy.updatedAt = new Date().toJSON();

    if (ownFields) {
      Object.entries(ownFields).forEach(([k, v]) => {
        proxy[k] = v;
      });
    }

    if (definitionsInput) {
      const idToDefinitionToUpdateMap: {
        [k: string]: DefinitionUpdateVal;
      } = {};

      definitionsInput.forEach(({ id, name, updatedAt }) => {
        const updateVal: DefinitionUpdateVal = { name };

        if (updatedAt) {
          updateVal.updatedAt = updatedAt;
        }

        idToDefinitionToUpdateMap[id] = updateVal;
      });

      proxy.dataDefinitions = proxy.dataDefinitions.map(d => {
        const definition = d as DataDefinitionFragment;
        const { id } = definition;

        const found = idToDefinitionToUpdateMap[id];

        if (found) {
          Object.entries(found).forEach(([k, v]) => {
            definition[k] = v;
          });
        }

        return definition;
      });
    }
  });

  parentDispatch({
    type: ExperienceActype.SYNC_EDITED_OFFLINE_EXPERIENCE,
    experience: updatedExperience,
    onError: error => {
      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error,
      });
    },
  });
}

function onExperienceUpdatedEffectHelper(
  updateResult: UpdateExperiencesOnline_updateExperiences_UpdateExperiencesSomeSuccess_experiences,
  props: Props,
  effectArgs: EffectArgs,
) {
  const { dispatch } = effectArgs;

  switch (updateResult.__typename) {
    case "UpdateExperienceFullErrors":
      {
        const {
          errors: { error },
        } = updateResult;

        dispatch({
          type: ActionType.ON_COMMON_ERROR,
          error,
        });
      }
      break;

    case "UpdateExperienceSomeSuccess": {
      const { experience } = updateResult;
      const { ownFields, updatedDefinitions } = experience;

      if (!(ownFields || updatedDefinitions)) {
        dispatch({
          type: ActionType.ON_COMMON_ERROR,
          error: GENERIC_SERVER_ERROR,
        });

        return;
      }

      const payload = {} as OnUpdatedPayload;

      if (ownFields) {
        payload.ownFields = ownFields;
      }

      if (updatedDefinitions) {
        payload.definitions = updatedDefinitions;
      }

      dispatch({
        type: ActionType.ON_UPDATED_ONLINE,
        ...payload,
      });

      return;
    }
  }
}

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
  submitEffect,
  scrollToViewEffect,
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
////////////////////////// END EFFECTS SECTION /////////////////////////

////////////////////////// STATE UPDATE SECTION /////////////////

export function initState({
  experience,
}: {
  experience: ExperienceNoEntryFragment;
}): StateMachine {
  const { title, dataDefinitions } = experience;
  // istanbul ignore next: trivial
  const description = experience.description || "";

  return {
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
    states: {
      dataDefinitions: dataDefinitions.reduce((acc, d) => {
        const { name: defaultName, id, type } = d as DataDefinitionFragment;

        acc[id] = {
          context: {
            defaultName,
            type,
          },
          states: {
            value: StateValue.unchanged,
          },
        };

        return acc;
      }, {} as DraftState["states"]["dataDefinitions"]),
      submission: { value: StateValue.inactive },
      meta: {
        fields: {
          title: {
            context: {
              defaults: title,
            },
            states: {
              value: StateValue.unchanged,
            },
          },
          description: {
            context: {
              defaults: description,
            },
            states: {
              value: StateValue.unchanged,
            },
          },
        },
      },
    },
  };
}

function handleDefinitionChangedAction(
  proxy: DraftState,
  payload: DefinitionChangedPayload,
) {
  const { text, id } = payload;
  const {
    states: { dataDefinitions },
  } = proxy;

  const field = dataDefinitions[id];
  handleFormChangedActionHelper(
    (field as unknown) as FormField,
    field.context.defaultName,
    text,
  );
}

function handleFormChangedAction(
  proxy: DraftState,
  payload: FormChangedPayload,
) {
  const { text, fieldName } = payload;
  const {
    states: {
      meta: { fields },
    },
  } = proxy;

  const field = fields[fieldName];

  handleFormChangedActionHelper(field, field.context.defaults, text);
}

function handleFormChangedActionHelper(
  field: FormField,
  defaultVal: string,
  text: string,
) {
  // const trimmedText = text.trim();

  // if (trimmedText === defaultVal) {
  //   field.states.value = StateValue.unchanged;
  //   delete field.states[StateValue.changed];
  //   return;
  // }

  const state = field.states as ChangedState;
  state.value = StateValue.changed;
  state.changed = state.changed || {
    context: { formValue: text },
    states: {
      value: StateValue.initial,
    },
  };

  state.changed.context.formValue = text;
}

function handleSubmittingAction(proxy: DraftState) {
  const {
    states: { submission },
  } = proxy;
  const effects = getGeneralEffects(proxy);

  submission.value = StateValue.inactive;

  const input = validateForm(proxy);
  const submissionErrorsState = submission as SubmissionErrors;
  const submissionWarningState = submission as SubmissionWarning;

  if (
    submissionErrorsState.value === StateValue.errors ||
    submissionWarningState.value === StateValue.warning
  ) {
    effects.push({
      key: "scrollToViewEffect",
      ownArgs: {
        id: scrollToTopId,
      },
    });
    return;
  }

  submission.value = StateValue.submitting;

  effects.push({
    key: "submitEffect",
    ownArgs: { input },
  });
}

export const NOTHING_TO_SAVE_WARNING_MESSAGE =
  "Please make changes before saving.";

function validateForm(proxy: DraftState): FormInput {
  const {
    states: {
      submission,
      dataDefinitions,
      meta: { fields },
    },
  } = proxy;

  const {
    title: {
      context: { defaults: defaultTitle },
      states: titleState0,
    },
    description: {
      states: descriptionState0,
      context: { defaults: defaultDescription },
    },
  } = fields;

  const submissionErrorState = submission as SubmissionErrors;
  const submissionWarningState = submission as SubmissionWarning;

  const input = {} as FormInput;
  const ownFieldsInput = {} as UpdateExperienceOwnFieldsInput;
  const definitionsInput: UpdateDefinitionInput[] = [];
  let ownFieldsUpdated = false;
  let definitionsUpdated = false;

  if (titleState0.value === StateValue.changed) {
    const {
      changed: {
        context: { formValue },
        states: titleValidityState0,
      },
    } = titleState0;

    const value = formValue.trim();

    if (value !== defaultTitle) {
      ownFieldsUpdated = true;

      if (value.length < 2) {
        submissionErrorState.value = StateValue.errors;
        submissionErrorState.errors = {
          context: {
            errors: FORM_CONTAINS_ERRORS_MESSAGE,
          },
        };

        const titleValidityState = titleValidityState0 as FieldInValid;
        titleValidityState.value = StateValue.invalid;
        titleValidityState.invalid = {
          context: {
            errors: [["", "title must be at least 2 characters long"]],
          },
        };
      } else {
        ownFieldsInput.title = value;
        titleValidityState0.value = StateValue.valid;
      }
    }
  }

  if (descriptionState0.value === StateValue.changed) {
    const {
      changed: {
        context: { formValue },
      },
    } = descriptionState0;

    const value = formValue.trim();

    if (value !== defaultDescription) {
      ownFieldsUpdated = true;

      ownFieldsInput.description = value;
    }
  }

  Object.entries(dataDefinitions).forEach(([definitionId, field]) => {
    const {
      states: state,
      context: { defaultName },
    } = field;

    if (state.value === StateValue.changed) {
      const {
        changed: {
          context: { formValue },
          states: validityState0,
        },
      } = state;

      const value = formValue.trim();

      if (value !== defaultName) {
        definitionsUpdated = true;

        if (value.length < 2) {
          submissionErrorState.value = StateValue.errors;
          submissionErrorState.errors = {
            context: {
              errors: FORM_CONTAINS_ERRORS_MESSAGE,
            },
          };

          const inValidState = validityState0 as FieldInValid;
          inValidState.value = StateValue.invalid;
          inValidState.invalid = {
            context: {
              errors: [["name", "must be at least 2 characters long"]],
            },
          };
        } else {
          definitionsInput.push({
            id: definitionId,
            name: value,
          });

          validityState0.value = StateValue.valid;
        }
      }
    }
  });

  if (!ownFieldsUpdated && !definitionsUpdated) {
    submissionWarningState.value = StateValue.warning;
    submissionWarningState.warning = {
      context: {
        warning: NOTHING_TO_SAVE_WARNING_MESSAGE,
      },
    };
  }

  if (ownFieldsUpdated) {
    input.ownFields = ownFieldsInput;
  }

  if (definitionsUpdated) {
    input.updateDefinitions = definitionsInput;
  }

  return input;
}

function handleOnUpdatedOfflineAction(
  proxy: DraftState,
  payload: OnUpdatedOfflinePayload,
) {
  const {
    states: {
      submission,
      meta: { fields },
      dataDefinitions,
    },
  } = proxy;

  const { result } = payload;
  let error = "";

  if (result) {
    switch (result.__typename) {
      case "UpdateExperienceOfflineError":
        error = GENERIC_SERVER_ERROR;
        break;

      case "UpdateExperienceOfflineSuccess": {
        const { ownFields, updateDefinitions } = result.data;

        if (ownFields) {
          const { title: titleField, description: descriptionField } = fields;
          const { title, description } = ownFields;

          titleField.context.defaults = title || titleField.context.defaults;
          titleField.states.value = StateValue.unchanged;

          descriptionField.context.defaults =
            description || descriptionField.context.defaults;
          descriptionField.states.value = StateValue.unchanged;
        }

        if (updateDefinitions) {
          updateDefinitions.forEach(({ id, name }) => {
            const field = dataDefinitions[id];
            field.context.defaultName = name;
            field.states.value = StateValue.unchanged;
          });
        }
      }
    }
  } else {
    error = GENERIC_SERVER_ERROR;
  }

  if (error) {
    handleOnCommonErrorAction(proxy, {
      error,
    });
  } else {
    submission.value = StateValue.success;
  }

  const effects = getGeneralEffects(proxy);

  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollToTopId,
    },
  });
}

function handleOnUpdatedOnlineAction(
  proxy: DraftState,
  payload: OnUpdatedPayload,
) {
  const {
    states: { submission },
  } = proxy;

  handleOnUpdatedOwnFieldsOnlineActionHelper(proxy, payload.ownFields);
  handleOnUpdatedDefinitionsOnlineActionHelper(proxy, payload.definitions);

  const updatedSubmission = submission;

  if (updatedSubmission.value !== StateValue.errors) {
    submission.value = StateValue.success;

    const effects = getGeneralEffects(proxy);

    effects.push({
      key: "scrollToViewEffect",
      ownArgs: {
        id: scrollToTopId,
      },
    });
  }
}

function handleOnUpdatedDefinitionsOnlineActionHelper(
  proxy: DraftState,
  payload: OnUpdatedPayload["definitions"],
) {
  if (!payload) {
    return;
  }

  const {
    states: { dataDefinitions },
  } = proxy;

  let hasErrors = false;

  payload.forEach(def => {
    switch (def.__typename) {
      case "DefinitionSuccess":
        {
          const {
            definition: { id, name },
          } = def;
          const field = dataDefinitions[id];
          field.context.defaultName = name;
          field.states.value = StateValue.unchanged;
        }
        break;

      case "DefinitionErrors": {
        hasErrors = true;
        const {
          /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
          errors: { id, __typename, ...errors },
        } = def;
        const field = dataDefinitions[id].states as ChangedState;
        const validityState = field.changed.states as FieldInValid;
        validityState.value = StateValue.invalid;
        validityState.invalid = {
          context: {
            errors: Object.entries(errors).filter(([, v]) => !!v),
          },
        };
      }
    }
  });

  if (hasErrors) {
    handleFormContainsErrorsHelper(proxy);
  }
}

function handleOnUpdatedOwnFieldsOnlineActionHelper(
  proxy: DraftState,
  payload: OnUpdatedPayload["ownFields"],
) {
  if (!payload) {
    return;
  }

  const {
    states: {
      meta: { fields },
    },
  } = proxy;

  switch (payload.__typename) {
    case "ExperienceOwnFieldsSuccess":
      {
        const { data } = payload;
        const { title: titleField, description: descriptionField } = fields;
        titleField.context.defaults = data.title;
        titleField.states.value = StateValue.unchanged;
        // istanbul ignore next: trivial
        descriptionField.context.defaults = data.description || "";
        descriptionField.states.value = StateValue.unchanged;
      }
      break;

    case "UpdateExperienceOwnFieldsErrors": {
      handleFormContainsErrorsHelper(proxy);
      const { errors } = payload;
      const titleState = fields.title.states as ChangedState;

      const titleValidityState = titleState.changed.states as FieldInValid;
      titleValidityState.value = StateValue.invalid;
      titleValidityState.invalid = {
        context: {
          errors: [["title", errors.title]],
        },
      };
    }
  }
}

function handleFormContainsErrorsHelper(proxy: DraftState) {
  const submission = proxy.states.submission;

  submission.value = StateValue.errors;
  const submissionErrorState = submission as SubmissionErrors;
  submissionErrorState.errors = {
    context: {
      errors: FORM_CONTAINS_ERRORS_MESSAGE,
    },
  };
}

function handleResetFormFieldsAction(proxy: DraftState) {
  const {
    states: {
      submission,
      dataDefinitions,
      meta: { fields },
    },
  } = proxy;

  submission.value = StateValue.inactive;

  Object.entries(dataDefinitions)
    .map(([, field]) => {
      return (field as unknown) as FormField;
    })
    .concat(Object.values(fields))
    .forEach(({ states }) => {
      states.value = StateValue.unchanged;
      delete states[StateValue.changed];
    });
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

////////////////////////// END STATE UPDATE SECTION ////////////

////////////////////////// TYPES SECTION ////////////////////

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly states: {
    readonly dataDefinitions: {
      readonly [k: string]: DefinitionField;
    };
    readonly submission: Submission;
    readonly meta: {
      readonly fields: {
        readonly title: FormField;
        readonly description: FormField;
      };
    };
  };
  readonly effects: {
    general: EffectState | { value: NoEffectVal };
  };
}

////////////////////////// STRINGY TYPES SECTION /////////////
type NoEffectVal = "noEffect";
type HasEffectsVal = "hasEffects";
type ActiveVal = "active";
type InActiveVal = "inactive";
type SubmittingVal = "submitting";
type UnChangedVal = "unchanged";
type ChangedVal = "changed";
type ValidVal = "valid";
type InvalidVal = "invalid";
type InitialVal = "initial";
type SuccessVal = "success";
type ErrorsVal = "errors";
type WarningVal = "warning";
////////////////////////// END STRINGY TYPES SECTION /////////

type DefinitionField = {
  context: {
    defaultName: string;
    type: DataTypes;
  };
} & {
  states: { value: UnChangedVal } | ChangedState;
};

type FormField = {
  context: {
    defaults: string;
  };
} & {
  states: { value: UnChangedVal } | ChangedState;
};

interface ChangedState {
  value: ChangedVal;
  changed: {
    context: {
      formValue: string;
    };
    states: { value: InitialVal } | { value: ValidVal } | FieldInValid;
  };
}

export type FieldServerError = [string, string][];

interface FieldInValid {
  value: InvalidVal;
  invalid: {
    context: {
      errors: FieldServerError;
    };
  };
}

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

export type Action =
  | ({
      type: ActionType.ON_UPDATED_OFFLINE;
    } & OnUpdatedOfflinePayload)
  | {
      type: ActionType.CLOSE_SUBMIT_NOTIFICATION;
    }
  | {
      type: ActionType.SUBMITTING;
    }
  | {
      type: ActionType.FORM_ERRORS;
    }
  | ({
      type: ActionType.SERVER_ERRORS;
    } & ServerErrorPayload)
  | ({
      type: ActionType.FORM_CHANGED;
    } & FormChangedPayload)
  | ({
      type: ActionType.ON_UPDATED_ONLINE;
    } & OnUpdatedPayload)
  | {
      type: ActionType.RESET_FORM_FIELDS;
    }
  | ({
      type: ActionType.DEFINITION_CHANGED;
    } & DefinitionChangedPayload)
  | ({
      type: ActionType.ON_COMMON_ERROR;
    } & StringyErrorPayload);

interface OnUpdatedOfflinePayload {
  result: UpdateExperienceOffline["updateExperienceOffline"] | undefined;
}

interface OnUpdatedPayload {
  ownFields?: UpdateExperienceOwnFieldsUnionFragment;
  definitions?: UpdateDefinitionUnionFragment[];
}

interface FormChangedPayload {
  text: string;
  fieldName: keyof StateMachine["states"]["meta"]["fields"];
}

interface DefinitionChangedPayload {
  text: string;
  id: string;
}

interface ServerErrorPayload {
  errors: UpdateExperienceMutation_updateExperience_errors;
}

type DispatchType = Dispatch<Action>;

export interface CallerProps {
  experience: ExperienceFragment;
  parentDispatch: ExperienceDispatchType;
}

export type Props = CallerProps &
  UpdateExperienceOfflineComponentProps &
  UpdateExperiencesOnlineComponentProps & {
    hasConnection: boolean;
    client: ApolloClient<{}>;
    persistor: AppPersistor;
    cache: InMemoryCache;
  };

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

interface EffectState {
  value: HasEffectsVal;
  hasEffects: {
    context: {
      effects: EffectsList;
    };
  };
}

type EffectsList = (DefSubmitEffect | ScrollToViewEffect)[];

type FormInput = Pick<
  UpdateAnExperienceInput,
  "ownFields" | "updateDefinitions"
>;
