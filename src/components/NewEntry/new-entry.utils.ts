import { RouteComponentProps } from "@reach/router";
import { Reducer, Dispatch } from "react";
import { NewEntryRouteParams } from "../../routes";
import {
  ExperienceFragment,
  ExperienceFragment_dataDefinitions,
} from "../../graphql/apollo-types/ExperienceFragment";
import immer, { Draft } from "immer";
import ApolloClient, { ApolloError } from "apollo-client";
import {
  DataTypes,
  CreateEntryInput,
  CreateDataObject,
} from "../../graphql/apollo-types/globalTypes";
import {
  CreateOnlineEntryMutation_createEntry_errors,
  CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors,
  CreateOnlineEntryMutation_createEntry,
} from "../../graphql/apollo-types/CreateOnlineEntryMutation";
import dateFnFormat from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { CreateOnlineEntryMutationComponentProps } from "../../graphql/create-entry.mutation";
import {
  CreateOfflineEntryMutationComponentProps,
  CreateOfflineEntryMutationReturned,
} from "./new-entry.resolvers";
import { wrapReducer } from "../../logger";
import { isConnected } from "../../state/connections";
import { upsertExperienceWithEntry } from "./new-entry.injectables";
import { scrollIntoView } from "../scroll-into-view";
import { AppPersistor } from "../../context";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
  scrollIntoViewNonFieldErrorDomId,
  makeFieldErrorDomId,
} from "./new-entry.dom";

const NEW_LINE_REGEX = /\n/g;
export const ISO_DATE_FORMAT = "yyyy-MM-dd";
const ISO_DATE_TIME_FORMAT = ISO_DATE_FORMAT + "'T'HH:mm:ssXXX";

export enum ActionType {
  ON_FORM_FIELD_CHANGED = "@components/new-entry/on-form-field-changed",
  ON_CREATE_ENTRY_EXCEPTION = "@components/new-entry/set-server-errors",
  ON_CREATE_ENTRY_ERRORS = "@components/new-entry/set-create-entry-errors",
  DISMISS_SERVER_ERRORS = "@components/new-entry/unset-server-errors",
  ON_SUBMIT = "@components/new-entry/on-submit",
}

export const StateValue = {
  noEffect: "noEffect" as NoEffectVal,
  hasEffects: "hasEffects" as HasEffects,
  active: "active" as ActiveValue,
  inactive: "inactive" as InActiveValue,
  errors: "errors" as ErrorsStateValue,
  fieldErrors: "fieldErrors" as FieldErrorsValue,
  nonFieldErrors: "nonFieldErrors" as NonFieldErrorsValue,
};

export function toISODateString(date: Date) {
  return dateFnFormat(date, ISO_DATE_FORMAT);
}

export function toISODatetimeString(date: Date | string) {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  const formatedDate = dateFnFormat(parsedDate, ISO_DATE_TIME_FORMAT);
  return formatedDate;
}

export function formObjToString(type: DataTypes, val: FormObjVal) {
  let toString = val;

  switch (type) {
    case DataTypes.DATE:
      toString = toISODateString(val as Date);
      break;

    case DataTypes.DATETIME:
      toString = toISODatetimeString(val as Date);
      break;

    case DataTypes.DECIMAL:
    case DataTypes.INTEGER:
      toString = (val || 0) + "";
      break;

    case DataTypes.SINGLE_LINE_TEXT:
      toString = val;
      break;

    case DataTypes.MULTI_LINE_TEXT:
      toString = (val as string).replace(NEW_LINE_REGEX, "\\\\n");
      break;
  }

  return (toString as string).trim();
}

export function makePageTitle(exp: ExperienceFragment | null | undefined) {
  return "[New Entry] " + ((exp && exp.title) || "entry");
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer<StateMachine, Action>(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.general.value = StateValue.noEffect;

        switch (type) {
          case ActionType.ON_FORM_FIELD_CHANGED:
            handleFormFieldChangedAction(proxy, payload as FieldChangedPayload);
            break;

          case ActionType.ON_SUBMIT:
            handleSubmittingAction(proxy);
            break;

          case ActionType.ON_CREATE_ENTRY_ERRORS:
            handleOnCreateEntryErrors(
              proxy,
              payload as CreateOnlineEntryMutation_createEntry_errors,
            );
            break;

          case ActionType.ON_CREATE_ENTRY_EXCEPTION:
            handleOnServerErrorsAction(proxy, payload as ServerErrors);
            break;

          case ActionType.DISMISS_SERVER_ERRORS:
            proxy.states.submitting.value = StateValue.inactive;
            break;
        }
      });
    },

    // true,
  );

const UNKNOWN_ERROR = "Unknown error!";

export function interpretCreateEntryMutationException(payload: Error) {
  if (payload instanceof ApolloError) {
    const { graphQLErrors, networkError } = payload;

    if (networkError) {
      return "Network error!";
    }
    return graphQLErrors[0].message;
  }

  return UNKNOWN_ERROR;
}

////////////////////////// EFFECTS SECTION ////////////////////////////

export async function createEntryEffectHelper(
  { input, onDone }: CreateEntryEffectArgs,
  {
    createOnlineEntry,
    createOfflineEntry,
  }: Pick<ComponentProps, "createOfflineEntry" | "createOnlineEntry">,
) {
  let createResult: CreateOnlineEntryMutation_createEntry;
  const { experienceId } = input;

  if (isConnected()) {
    const result = await createOnlineEntry({
      variables: {
        input,
      },

      update: upsertExperienceWithEntry(experienceId, "online", onDone),
    });

    createResult = ((result && result.data && result.data.createEntry) ||
      {}) as CreateOnlineEntryMutation_createEntry;
  } else {
    const result = await createOfflineEntry({
      variables: {
        experienceId,
        dataObjects: input.dataObjects as CreateDataObject[],
      },
    });

    const { entry } = (result &&
      result.data &&
      result.data
        .createOfflineEntry) as CreateOfflineEntryMutationReturned["createOfflineEntry"];

    createResult = { entry } as CreateOnlineEntryMutation_createEntry;
  }

  return createResult;
}

const createEntryEffect: CreateEntryEffect["func"] = async (
  ownArgs,
  { createOnlineEntry, createOfflineEntry, persistor },
  { dispatch, goToExperience },
) => {
  try {
    const { entry, errors } = await createEntryEffectHelper(ownArgs, {
      createOnlineEntry,
      createOfflineEntry,
    });

    if (errors) {
      dispatch({ type: ActionType.ON_CREATE_ENTRY_ERRORS, ...errors });
      return;
    }

    await persistor.persist();

    if (entry) {
      goToExperience();
    }
  } catch (errors) {
    dispatch({
      type: ActionType.ON_CREATE_ENTRY_EXCEPTION,
      errors: interpretCreateEntryMutationException(errors),
    });
  }
};

interface CreateEntryEffectArgs {
  input: CreateEntryInput;
  onDone?: () => void;
}

type CreateEntryEffect = EffectDefinition<
  "createEntryEffect",
  CreateEntryEffectArgs
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
  createEntryEffect,
  scrollToViewEffect,
};

export function runEffects(
  effects: EffectsList,
  props: ComponentProps,
  thirdArgs: ThirdEffectFunctionArgs,
) {
  for (const { key, ownArgs } of effects) {
    effectFunctions[key](
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
      ownArgs as any,
      props,
      thirdArgs,
    );
  }
}

////////////////////////// END EFFECTS SECTION ////////////////////////////

////////////////////////// STATE UPDATE SECTION ////////////////////////////

export function initState(experience: ExperienceFragment): StateMachine {
  const dataDefinitions = experience.dataDefinitions as ExperienceFragment_dataDefinitions[];

  const formFields = dataDefinitions.reduce((acc, definition, index) => {
    const value =
      definition.type === DataTypes.DATE ||
      definition.type === DataTypes.DATETIME
        ? new Date()
        : "";

    acc[index] = {
      context: { definition, value },
    };

    return acc;
  }, {} as FormFields);

  return {
    states: {
      submitting: {
        value: StateValue.inactive,
      },
      form: {
        fields: formFields,
      },
    },
    context: { experience },
    effects: {
      general: {
        value: StateValue.noEffect,
      },
    },
  };
}

async function handleSubmittingAction(proxy: ProxyState) {
  const {
    context: { experience },
    states,
  } = proxy;

  states.submitting.value = StateValue.active;
  const { dataDefinitions, id: experienceId } = experience;
  const { form } = states;

  const dataObjects = dataObjectsFromFormValues(
    form.fields,
    dataDefinitions as ExperienceFragment_dataDefinitions[],
  );

  const effects = getRenderEffects(proxy);

  effects.push({
    key: "createEntryEffect",
    ownArgs: {
      input: {
        experienceId,
        dataObjects,
      },
    },
  });
}

export function typedErrorsToString<T extends {}>(errors: T) {
  return Object.entries(errors).reduce((a, [k, v]) => {
    if (v && k !== "__typename") {
      a += `\n${k}: ${v}`;
    }

    return a;
  }, "");
}

function handleOnCreateEntryErrors(
  stateMachine: ProxyState,
  payload: CreateOnlineEntryMutation_createEntry_errors,
) {
  const { states } = stateMachine;
  const submitting = states.submitting as SubmittingErrors;
  submitting.value = StateValue.errors;
  const {
    dataObjectsErrors,
  } = payload as CreateOnlineEntryMutation_createEntry_errors;

  if (!dataObjectsErrors) {
    submitting.errors = {
      value: StateValue.nonFieldErrors,
      nonFieldErrors: {
        context: {
          errors: UNKNOWN_ERROR,
        },
      },
    };

    const effects = getRenderEffects(stateMachine);
    effects.push({
      key: "scrollToViewEffect",
      ownArgs: {
        id: scrollIntoViewNonFieldErrorDomId,
      },
    });

    return;
  }

  const fieldErrors = dataObjectsErrors.reduce((acc, field) => {
    const {
      errors,
      index,
    } = field as CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors;

    acc[index] = typedErrorsToString(errors);

    return acc;
  }, {} as { [k: string]: string });

  submitting.errors = {
    value: StateValue.fieldErrors,
    fieldErrors: {
      context: {
        errors: fieldErrors,
      },
    },
  };

  const effects = getRenderEffects(stateMachine);

  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: getFieldErrorScrollToId(fieldErrors),
    },
  });
}

function handleOnServerErrorsAction(
  stateMachine: ProxyState,
  { errors }: ServerErrors,
) {
  const { states } = stateMachine;
  const submitting = states.submitting as SubmittingErrors;
  submitting.value = StateValue.errors;

  submitting.errors = {
    value: StateValue.nonFieldErrors,
    nonFieldErrors: {
      context: {
        errors,
      },
    },
  };

  const effects = getRenderEffects(stateMachine);
  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollIntoViewNonFieldErrorDomId,
    },
  });
}

function getFieldErrorScrollToId(fieldErrors: FieldErrors) {
  const [keyVal] = Object.entries(fieldErrors);

  const [id] = keyVal;
  return makeFieldErrorDomId(id);
}

function getRenderEffects(proxy: ProxyState) {
  const renderEffects = proxy.effects.general as GeneralEffect;
  renderEffects.value = StateValue.hasEffects;
  const effects: EffectsList = [];
  renderEffects.hasEffects = {
    context: {
      effects: effects,
    },
  };

  return effects;
}

function dataObjectsFromFormValues(
  formFields: StateMachine["states"]["form"]["fields"],
  dataDefinitions: ExperienceFragment_dataDefinitions[],
) {
  return Object.entries(formFields).reduce((acc, [stringIndex, field]) => {
    const index = Number(stringIndex);
    const definition = dataDefinitions[
      index
    ] as ExperienceFragment_dataDefinitions;

    const { type, id: definitionId } = definition;

    acc.push({
      definitionId,

      data: `{"${type.toLowerCase()}":"${formObjToString(
        type,
        field.context.value,
      )}"}`,
    });

    return acc;
  }, [] as CreateDataObject[]);
}

function handleFormFieldChangedAction(
  proxy: ProxyState,
  payload: FieldChangedPayload,
) {
  const { fieldIndex, value } = payload;

  proxy.states.form.fields[fieldIndex].context.value = value;
}

////////////////////////// END STATE UPDATE SECTION /////////////////////

////////////////////////// TYPES SECTION ////////////////////////////

export interface NewEntryCallerProps
  extends RouteComponentProps<NewEntryRouteParams> {
  experience: ExperienceFragment;
}

export type ComponentProps = NewEntryCallerProps &
  CreateOnlineEntryMutationComponentProps &
  CreateOfflineEntryMutationComponentProps & {
    client: ApolloClient<{}>;
    persistor: AppPersistor;
    cache: InMemoryCache;
  };

export type FormObjVal = Date | string | number;

// the keys are the indices of the field definitions and the values are the
// default values for each field data type e.g number for integer and date
// for date
export interface FormFields {
  [k: string]: FieldState;
}

export interface FieldState {
  context: {
    value: FormObjVal;
    definition: ExperienceFragment_dataDefinitions;
  };
}

export interface FieldComponentProps {
  formFieldName: string;
  dispatch: DispatchType;
  value: FormObjVal;
}

export type ToString = (val: FormObjVal) => string;
interface FieldChangedPayload {
  fieldIndex: string | number;
  value: FormObjVal;
}

interface FieldErrors {
  [k: string]: string;
}

interface ServerErrors {
  errors: string;
}

type ProxyState = Draft<StateMachine>;

interface StateMachine {
  readonly context: {
    readonly experience: ExperienceFragment;
  };
  readonly effects: {
    readonly general: GeneralEffect | { value: NoEffectVal };
  };
  readonly states: {
    readonly submitting: SubmittingState;
    readonly form: {
      readonly fields: FormFields;
    };
  };
}

export type SubmittingState =
  | SubmittingErrors
  | { value: ActiveValue }
  | {
      value: InActiveValue;
    };

interface SubmittingErrors {
  value: ErrorsStateValue;
  errors: SubmittingFieldErrors | SubmittingNonFieldErrors;
}

interface SubmittingNonFieldErrors {
  value: NonFieldErrorsValue;
  nonFieldErrors: {
    context: {
      errors: string;
    };
  };
}

interface SubmittingFieldErrors {
  value: FieldErrorsValue;
  fieldErrors: {
    context: {
      errors: FieldErrors;
    };
  };
}

interface RunOnceEffectState<IEffect> {
  run: boolean;
  effect: IEffect;
}

type Action =
  | { type: ActionType.ON_SUBMIT }
  | { type: ActionType.DISMISS_SERVER_ERRORS }
  | ({
      type: ActionType.ON_CREATE_ENTRY_ERRORS;
    } & CreateOnlineEntryMutation_createEntry_errors)
  | ({
      type: ActionType.ON_FORM_FIELD_CHANGED;
    } & FieldChangedPayload)
  | ({
      type: ActionType.ON_CREATE_ENTRY_EXCEPTION;
    } & ServerErrors);

export type DispatchType = Dispatch<Action>;

////////////////////////// STRINGY TYPES SECTION /////////////
type NoEffectVal = "noEffect";
type HasEffects = "hasEffects";
type InActiveValue = "inactive";
type ActiveValue = "active";
type FieldErrorsValue = "fieldErrors";
type NonFieldErrorsValue = "nonFieldErrors";
type ErrorsStateValue = "errors";
/////////////////////// END STRINGY TYPES SECTION /////////////

interface EffectContext {
  effectsArgsObj: ComponentProps;
}

type EffectsList = (ScrollToViewEffect | CreateEntryEffect)[];

interface GeneralEffect {
  value: HasEffects;
  hasEffects: {
    context: {
      effects: EffectsList;
    };
  };
}

interface ThirdEffectFunctionArgs {
  dispatch: DispatchType;
  goToExperience: () => void;
}

interface EffectDefinition<
  Key extends keyof typeof effectFunctions,
  OwnArgs = {}
> {
  key: Key;
  ownArgs: OwnArgs;
  func?: (
    ownArgs: OwnArgs,
    props: ComponentProps,
    thirdArgs: ThirdEffectFunctionArgs,
  ) => void | Promise<void | (() => void)> | (() => void);
}
