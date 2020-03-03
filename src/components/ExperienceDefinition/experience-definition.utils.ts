import { RouteComponentProps, NavigateFn } from "@reach/router";
import { Reducer, Dispatch } from "react";
import immer, { Draft } from "immer";
import {
  CreateExperienceInput as FormValues,
  CreateDataDefinition,
  DataTypes,
} from "../../graphql/apollo-types/globalTypes";
import ApolloClient from "apollo-client";
import { wrapReducer } from "../../logger";
import { CreateExperienceOfflineMutationComponentProps } from "./experience-definition.resolvers";
import {
  CommonErrorPayload,
  parseStringError,
  FORM_CONTAINS_ERRORS_MESSAGE,
  NOTHING_TO_SAVE_WARNING_MESSAGE,
  GENERIC_SERVER_ERROR,
  FieldError,
} from "../../general-utils";
import { scrollIntoView } from "../scroll-into-view";
import { scrollIntoViewDomId } from "./experience-definition.dom";
import { CreateExperiencesComponentProps } from "../../graphql/experiences.mutation";
import { entriesPaginationVariables } from "../../graphql/get-experience-full.query";
import { makeExperienceRoute } from "../../constants/experience-route";
import { isConnected } from "../../state/connections";
import {
  CreateExperiences_createExperiences_CreateExperienceErrors_errors,
  CreateExperiences_createExperiences_CreateExperienceErrors_errors_dataDefinitions,
} from "../../graphql/apollo-types/CreateExperiences";
import { createExperiencesManualUpdate } from "../../apollo-cache/create_experiences-update";
import { makeDefinitionId } from "./experience-definition.injectables";

export const fieldTypeKeys = Object.values(DataTypes);

export enum ActionType {
  SUBMITTING = "@experience-definition/submitting",
  FORM_ERRORS = "@experience-definition/form-errors",
  ON_COMMON_ERROR = "@experience-definition/on-common-error",
  CLOSE_SUBMIT_NOTIFICATION = "@experience-definition/close-submit-notification",
  FORM_CHANGED = "@experience-definition/form-changed",
  RESET_FORM_FIELDS = "@experience-definition/reset-form-fields",
  ON_SERVER_ERRORS = "@experience-definition/on-server-errors",
  ADD_DEFINITION = "@experience-definition/add-definition",
  REMOVE_DEFINITION = "@experience-definition/remove-definition",
  DOWN_DEFINITION = "@experience-definition/down-definition",
  UP_DEFINITION = "@experience-definition/up-definition",
  TOGGLE_DESCRIPTION = "@experience-definition/toggle-description",
}

export const StateValue = {
  noEffect: "noEffect" as NoEffectVal,
  hasEffects: "hasEffects" as HasEffectsVal,
  inactive: "inactive" as InActiveVal,
  unchanged: "unchanged" as UnChangedVal,
  commonErrors: "commonErrors" as CommonErrorsVal,
  warning: "warning" as WarningVal,
  active: "active" as ActiveVal,
  submitting: "submitting" as SubmittingVal,
  changed: "changed" as ChangedVal,
  valid: "valid" as ValidVal,
  invalid: "invalid" as InvalidVal,
  initial: "initial" as InitialVal,
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

          case ActionType.SUBMITTING:
            handleSubmissionAction(proxy);
            break;

          case ActionType.ON_COMMON_ERROR:
            handleOnCommonErrorAction(proxy, payload as CommonErrorPayload);
            break;

          case ActionType.CLOSE_SUBMIT_NOTIFICATION:
            handleCloseSubmitNotificationAction(proxy);
            break;

          case ActionType.RESET_FORM_FIELDS:
            handleResetFormFieldsAction(proxy);
            break;

          case ActionType.ADD_DEFINITION:
            proxy.states.form.fields.dataDefinitions.push(
              makeDataDefinitionFormField(),
            );
            break;

          case ActionType.REMOVE_DEFINITION:
            proxy.states.form.fields.dataDefinitions.splice(
              (payload as RemoveDefinitionPayload).index,
              1,
            );
            break;

          case ActionType.DOWN_DEFINITION:
            handleDownDefinitionAction(
              proxy,
              payload as RemoveDefinitionPayload,
            );
            break;

          case ActionType.UP_DEFINITION:
            handleUpDefinitionAction(proxy, payload as RemoveDefinitionPayload);
            break;

          case ActionType.TOGGLE_DESCRIPTION:
            handleToggleDescriptionAction(proxy);
            break;

          case ActionType.ON_SERVER_ERRORS:
            handleOnServerErrorsAction(proxy, payload as ServerErrorsPayload);
            break;
        }
      });
    },
    // true,
  );

////////////////////////// EFFECTS SECTION /////////////////////////

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

const submissionEffect: DefSubmissionEffect["func"] = async (
  { input },
  props,
  effectArgs,
) => {
  const { createExperiences, createExperienceOffline, navigate } = props;
  const { dispatch } = effectArgs;
  const variables = { input: [input], ...entriesPaginationVariables };

  try {
    if (!isConnected()) {
      const result = await createExperienceOffline({
        variables,
      });

      const validResponse =
        result && result.data && result.data.createOfflineExperience;

      if (validResponse) {
        const experienceId = validResponse.id;
        (navigate as NavigateFn)(makeExperienceRoute(experienceId));
      } else {
        dispatch({
          type: ActionType.ON_COMMON_ERROR,
          error: GENERIC_SERVER_ERROR,
        });
      }

      return;
    }

    const responses = await createExperiences({
      variables,
      update: createExperiencesManualUpdate,
    });

    const validResponses =
      responses && responses.data && responses.data.createExperiences;

    if (!validResponses) {
      dispatch({
        type: ActionType.ON_COMMON_ERROR,
        error: GENERIC_SERVER_ERROR,
      });

      return;
    }

    const response = validResponses[0];

    if (response.__typename === "CreateExperienceErrors") {
      const { errors } = response;

      dispatch({
        type: ActionType.ON_SERVER_ERRORS,
        errors,
      });
    } else {
      const { experience } = response;
      (navigate as NavigateFn)(makeExperienceRoute(experience.id));
    }
  } catch (error) {
    dispatch({
      type: ActionType.ON_COMMON_ERROR,
      error,
    });
  }
};

type DefSubmissionEffect = EffectDefinition<
  "submissionEffect",
  {
    input: FormValues;
  }
>;

const scrollToViewEffect: DefScrollToViewEffect["func"] = ({ id }) => {
  scrollIntoView(id, {
    behavior: "smooth",
  });
};

type DefScrollToViewEffect = EffectDefinition<
  "scrollToViewEffect",
  {
    id: string;
  }
>;

export const effectFunctions = {
  submissionEffect,
  scrollToViewEffect,
};

////////////////////////// END EFFECTS SECTION /////////////////////////

////////////////////////// STATE UPDATE SECTION /////////////////

function makeDataDefinitionFormField() {
  return {
    id: makeDefinitionId(),
    name: {
      states: {
        value: StateValue.unchanged,
      },
    },
    type: {
      states: {
        value: StateValue.unchanged,
      },
    },
  };
}

export function initState(): StateMachine {
  return {
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
    states: {
      submission: { value: StateValue.inactive },
      form: {
        validity: { value: StateValue.initial },
        fields: {
          title: {
            states: {
              value: StateValue.unchanged,
            },
          },
          description: {
            value: StateValue.active,
            active: {
              states: {
                value: StateValue.unchanged,
              },
            },
          },
          dataDefinitions: [makeDataDefinitionFormField()],
        },
      },
    },
  };
}

function handleFormChangedAction(
  proxy: DraftState,
  payload: FormChangedPayload,
) {
  const {
    states: {
      form: { fields },
    },
  } = proxy;

  const { fieldName, value } = payload;
  let state = {} as ChangedState;

  if (payload.key === "non-def") {
    const field = fields[fieldName];

    if (fieldName === "title") {
      state = (field as FormField).states as ChangedState;
    } else {
      state = (field as DescriptionFormFieldActive).active
        .states as ChangedState;
    }
  } else {
    const field = fields.dataDefinitions[payload.index][fieldName];
    state = (field as FormField).states as ChangedState;
  }

  state.value = StateValue.changed;

  state.changed = state.changed || {
    context: { formValue: value },
    states: {
      value: StateValue.initial,
    },
  };

  state.changed.context.formValue = value;
}

function handleSubmissionAction(proxy: DraftState) {
  const {
    states: { submission },
  } = proxy;

  const effects = getGeneralEffects(proxy);
  submission.value = StateValue.inactive;

  const input = validateForm(proxy);
  const submissionErrorsState = submission as SubmissionCommonErrors;
  const submissionWarningState = submission as SubmissionWarning;

  if (
    submissionErrorsState.value === StateValue.commonErrors ||
    submissionWarningState.value === StateValue.warning
  ) {
    effects.push({
      key: "scrollToViewEffect",
      ownArgs: {
        id: scrollIntoViewDomId,
      },
    });

    return;
  }

  submission.value = StateValue.submitting;

  effects.push({
    key: "submissionEffect",
    ownArgs: { input },
  });
}

const EMPTY_ERROR_TEXT = "is a required field";

function validateForm(proxy: DraftState): FormValues {
  const {
    states: {
      submission,
      form: { fields },
    },
  } = proxy;

  const submissionWarningState = submission as SubmissionWarning;

  const input = {} as FormValues;
  let formUpdated = false;

  Object.entries(fields).forEach(([fieldName, fieldState]) => {
    switch (fieldName) {
      case "title":
        {
          const state = (fieldState as FormField).states;

          const [formValue, updated] = validateFormStringValuesHelper(
            proxy,
            "title",
            state,
          );

          if (updated) {
            formUpdated = true;
          }

          if (formValue) {
            formUpdated = true;
            input.title = formValue;
          }
        }
        break;

      case "description":
        {
          // description field does not have to be active to be valid
          // user can edit and hide the description field especially if
          // text is quite long.

          const state = (fieldState as DescriptionFormFieldActive).active
            .states;

          if (state.value === StateValue.changed) {
            const {
              changed: {
                context: { formValue },
                states: validityState,
              },
            } = state;

            const value = formValue.trim();
            formUpdated = true;

            if (value) {
              input.description = value;
              validityState.value = StateValue.valid;
            }
          }
        }
        break;

      case "dataDefinitions":
        {
          const namesValuesMap: { [nameValue: string]: true } = {};

          (fieldState as DataDefinitionFormField[]).forEach(
            ({ name: nameState, type: typeState }, index) => {
              let hasValidValue = false;
              const dataDefinitions = input.dataDefinitions || [];

              const dataDefinition =
                dataDefinitions[index] || ({} as CreateDataDefinition);

              const [nameValue, nameUpdated] = validateFormStringValuesHelper(
                proxy,
                "field name",
                nameState.states,
              );

              if (nameUpdated) {
                formUpdated = true;
              }

              if (nameValue) {
                formUpdated = true;

                if (namesValuesMap[nameValue]) {
                  putFormFieldErrorHelper(
                    nameState.states,
                    [["field name", "has already been taken"]],
                    proxy,
                  );
                } else {
                  namesValuesMap[nameValue] = true;
                  dataDefinition.name = nameValue;
                  hasValidValue = true;
                }
              }

              const [typeValue, isTypeUpdated] = validateFormStringValuesHelper(
                proxy,
                "data type",
                typeState.states,
                `${EMPTY_ERROR_TEXT}, please select one from dropdown`,
              );

              if (typeValue) {
                dataDefinition.type = typeValue as DataTypes;
                formUpdated = true;
                hasValidValue = true;
              }

              if (isTypeUpdated) {
                formUpdated = true;
              }

              if (hasValidValue) {
                dataDefinitions[index] = dataDefinition;
                input.dataDefinitions = dataDefinitions;
              }
            },
          );
        }
        break;
    }
  });

  if (!formUpdated) {
    submissionWarningState.value = StateValue.warning;
    submissionWarningState.warning = {
      context: {
        warning: NOTHING_TO_SAVE_WARNING_MESSAGE,
      },
    };
  }

  return input;
}

function putFormFieldErrorHelper(
  fieldState: FormField["states"],
  errors: FieldError,
  proxy?: DraftState,
) {
  if (proxy) {
    const submissionErrorState = proxy.states
      .submission as SubmissionCommonErrors;

    submissionErrorState.value = StateValue.commonErrors;

    submissionErrorState.commonErrors = {
      context: {
        errors: FORM_CONTAINS_ERRORS_MESSAGE,
      },
    };
  }

  const fieldStateChanged = fieldState as ChangedState;
  fieldStateChanged.value = StateValue.changed;

  const changed =
    fieldStateChanged.changed ||
    ({
      states: {},
      context: { formValue: "" },
    } as ChangedState["changed"]);

  fieldStateChanged.changed = changed;

  const invalidState = changed.states as FieldInValid;
  invalidState.value = StateValue.invalid;
  invalidState.invalid = {
    context: {
      errors,
    },
  };
}

function validateFormStringValuesHelper(
  proxy: DraftState,
  fieldName: string,
  state: FormField["states"],
  emptyErrorText = EMPTY_ERROR_TEXT,
): [string, boolean] {
  let returnValue = "";
  let updated = false;

  if (state.value === StateValue.changed) {
    const {
      changed: {
        context: { formValue },
        states: validityState,
      },
    } = state;

    validityState.value = StateValue.initial;
    const value = formValue.trim();
    updated = true;

    if (value.length < 2) {
      putFormFieldErrorHelper(
        state,
        [[fieldName, "must be at least 2 characters long"]],
        proxy,
      );
    } else {
      returnValue = value;
      validityState.value = StateValue.valid;
    }
  } else {
    putFormFieldErrorHelper(state, [[fieldName, emptyErrorText]], proxy);
  }

  return [returnValue, updated];
}

function handleOnCommonErrorAction(
  proxy: DraftState,
  payload: CommonErrorPayload,
) {
  const errors = parseStringError(payload.error);

  const commonErrorsState = {
    value: StateValue.commonErrors,
    commonErrors: {
      context: {
        errors,
      },
    },
  } as Submission;

  proxy.states.submission = {
    ...proxy.states.submission,
    ...commonErrorsState,
  };

  const effects = getGeneralEffects(proxy);

  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollIntoViewDomId,
    },
  });
}

function handleResetFormFieldsAction(proxy: DraftState) {
  const {
    states: {
      submission,
      form: { fields },
    },
  } = proxy;

  submission.value = StateValue.inactive;

  Object.entries(fields).forEach(([fieldName, fieldState]) => {
    switch (fieldName) {
      case "title":
        {
          clearFieldInvalidState(fieldState as FormField);
        }

        break;

      case "description":
        {
          const state = (fieldState as DescriptionFormFieldActive).active
            .states;

          state.value = StateValue.unchanged;
        }

        break;

      case "dataDefinitions":
        {
          (fieldState as DataDefinitionFormField[]).forEach(
            ({ name, type }) => {
              clearFieldInvalidState(name);
              clearFieldInvalidState(type);
            },
          );
        }

        break;
    }
  });

  const effects = getGeneralEffects(proxy);

  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollIntoViewDomId,
    },
  });
}

function clearFieldInvalidState(formField: FormField) {
  const state = formField.states;
  state.value = StateValue.unchanged;

  if ((state as ChangedState).changed) {
    (state as ChangedState).changed.states.value = StateValue.initial;
  }
}

function handleDownDefinitionAction(
  proxy: DraftState,
  payload: RemoveDefinitionPayload,
) {
  const definitions = proxy.states.form.fields.dataDefinitions;
  const { index } = payload as RemoveDefinitionPayload;
  const definition = definitions[index + 1];
  definitions[index + 1] = definitions[index];
  definitions[index] = definition;
}

function handleUpDefinitionAction(
  proxy: DraftState,
  payload: RemoveDefinitionPayload,
) {
  const definitions = proxy.states.form.fields.dataDefinitions;
  const { index } = payload as RemoveDefinitionPayload;
  const definition = definitions[index - 1];
  definitions[index - 1] = definitions[index];
  definitions[index] = definition;
}

function handleToggleDescriptionAction(proxy: DraftState) {
  const {
    states: {
      form: {
        fields: { description },
      },
    },
  } = proxy;

  description.value =
    description.value === StateValue.active
      ? StateValue.inactive
      : StateValue.active;
}

function handleOnServerErrorsAction(
  proxy: DraftState,
  payload: ServerErrorsPayload,
) {
  proxy.states.submission.value = StateValue.inactive;

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    __typename,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    meta,
    dataDefinitions,
    title,
    ...errors
  } = payload.errors;

  const {
    states: {
      form: { fields, validity },
    },
  } = proxy;

  if (title) {
    const {
      title: { states },
    } = fields;

    putFormFieldErrorHelper(states, [["title", title]]);
  }

  const formInvalidState = validity as FormInValid;
  formInvalidState.value = StateValue.invalid;
  const invalidErrors = [] as FieldError;
  formInvalidState.invalid = {
    context: {
      errors: invalidErrors,
    },
  };

  const effects = getGeneralEffects(proxy);

  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollIntoViewDomId,
    },
  });

  Object.entries(errors).forEach(([k, v]) => {
    if (v) {
      invalidErrors.push([k, v]);
    }
  });

  if (dataDefinitions) {
    dataDefinitions.forEach(d => {
      const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        __typename,
        index,
        name: nameError,
        type: typeError,
      } = d as CreateExperiences_createExperiences_CreateExperienceErrors_errors_dataDefinitions;

      const state = fields.dataDefinitions[index];

      if (nameError) {
        putFormFieldErrorHelper(state.name.states, [["name", nameError]]);
      }

      if (typeError) {
        putFormFieldErrorHelper(state.type.states, [["type", typeError]]);
      }
    });
  }
}

function handleCloseSubmitNotificationAction(proxy: DraftState) {
  const {
    states: {
      submission,
      form: { validity },
    },
  } = proxy;
  submission.value = StateValue.inactive;
  validity.value = StateValue.initial;
}

////////////////////////// END STATE UPDATE SECTION ////////////

////////////////////////// TYPES SECTION ////////////////////////////

export type CallerProps = RouteComponentProps<{}>;

export type Props = CallerProps &
  CreateExperiencesComponentProps &
  CreateExperienceOfflineMutationComponentProps & {
    client: ApolloClient<{}>;
  };

export type Action =
  | ({
      type: ActionType.ON_SERVER_ERRORS;
    } & ServerErrorsPayload)
  | {
      type: ActionType.TOGGLE_DESCRIPTION;
    }
  | {
      type: ActionType.ADD_DEFINITION;
    }
  | ({
      type: ActionType.DOWN_DEFINITION;
    } & RemoveDefinitionPayload)
  | ({
      type: ActionType.UP_DEFINITION;
    } & RemoveDefinitionPayload)
  | ({
      type: ActionType.REMOVE_DEFINITION;
    } & RemoveDefinitionPayload)
  | {
      type: ActionType.CLOSE_SUBMIT_NOTIFICATION;
    }
  | ({
      type: ActionType.ON_COMMON_ERROR;
    } & CommonErrorPayload)
  | {
      type: ActionType.SUBMITTING;
    }
  | {
      type: ActionType.FORM_ERRORS;
    }
  | ({
      type: ActionType.FORM_CHANGED;
    } & FormChangedPayload)
  | {
      type: ActionType.RESET_FORM_FIELDS;
    };

interface ServerErrorsPayload {
  errors: CreateExperiences_createExperiences_CreateExperienceErrors_errors;
}

interface RemoveDefinitionPayload {
  index: number;
}

type FormChangedPayload =
  | NoneDefinitionChangedPayload
  | DefinitionChangedPayload;

interface NoneDefinitionChangedPayload {
  key: "non-def";
  value: string;
  fieldName: keyof StateMachine["states"]["form"]["fields"];
}

interface DefinitionChangedPayload {
  key: "def";
  index: number;
  value: DataTypes | string;
  fieldName: keyof DataDefinitionFormField;
}

////////////////////////// TYPES SECTION ////////////////////

////////////////////////// STRINGY TYPES SECTION ///////////

type NoEffectVal = "noEffect";
type HasEffectsVal = "hasEffects";
type ActiveVal = "active";
type InActiveVal = "inactive";
type SubmittingVal = "submitting";
type CommonErrorsVal = "commonErrors";
type WarningVal = "warning";
type ValidVal = "valid";
type InvalidVal = "invalid";
type InitialVal = "initial";
type UnChangedVal = "unchanged";
type ChangedVal = "changed";

////////////////////////// END STRINGY TYPES SECTION /////////

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly states: {
    readonly submission: Submission;
    readonly form: {
      readonly validity: FormValidity;
      readonly fields: {
        readonly title: FormField;
        readonly description: DescriptionFormField;
        readonly dataDefinitions: DataDefinitionFormField[];
      };
    };
  };
  readonly effects: {
    readonly general: EffectState | { value: NoEffectVal };
  };
}

export type FormValidity = { value: InitialVal } | FormInValid;

export type Submission =
  | {
      value: InActiveVal;
    }
  | Submitting
  | SubmissionCommonErrors
  | SubmissionWarning;

interface Submitting {
  value: SubmittingVal;
}

interface SubmissionCommonErrors {
  value: CommonErrorsVal;
  commonErrors: {
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

type DescriptionFormField = { value: InActiveVal } | DescriptionFormFieldActive;

interface DescriptionFormFieldActive {
  readonly value: ActiveVal;
  readonly active: FormField;
}

interface DataDefinitionFormField {
  readonly id: string;
  readonly name: FormField;
  readonly type: FormField<DataTypes>;
}

type FormField<Value = string> = {
  states: { value: UnChangedVal } | ChangedState<Value>;
};

interface ChangedState<Value = string> {
  value: ChangedVal;
  changed: {
    context: {
      formValue: Value;
    };
    states: { value: InitialVal } | { value: ValidVal } | FieldInValid;
  };
}

interface FieldInValid {
  value: InvalidVal;
  invalid: {
    context: {
      errors: FieldError;
    };
  };
}

interface FormInValid {
  value: InvalidVal;
  invalid: {
    context: {
      errors: FieldError;
    };
  };
}

interface EffectArgs {
  dispatch: DispatchType;
}

type VoidFn = () => void;

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
  ) => void | Promise<void | VoidFn | VoidFn>;
}

interface EffectState {
  value: HasEffectsVal;
  hasEffects: {
    context: {
      effects: EffectsList;
    };
  };
}

type EffectsList = (DefScrollToViewEffect | DefSubmissionEffect)[];

export type DispatchType = Dispatch<Action>;
