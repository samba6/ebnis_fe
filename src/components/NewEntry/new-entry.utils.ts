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
import {
  CreateOnlineEntryMutationComponentProps,
  MUTATION_NAME_createEntry,
} from "../../graphql/create-entry.mutation";
import {
  CreateOfflineEntryMutationComponentProps,
  CreateOfflineEntryMutationReturned,
} from "./new-entry.resolvers";
import { wrapReducer } from "../../logger";
import { isConnected } from "../../state/connections";
import { updateExperienceWithNewEntry } from "./new-entry.injectables";
import { scrollIntoView } from "../scroll-into-view";
import { AppPersistor } from "../../context";
import { cleanupRanQueriesFromCache } from "../../apollo-cache/cleanup-ran-queries-from-cache";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
  QUERY_NAME_getExperience,
  MUTATION_NAME_createOfflineEntry,
} from "../../state/resolvers";
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
  PUT_EFFECT_FUNCTIONS_ARGS = "@components/new-entry/put-effects-functions-args",
  ON_SUBMIT = "@components/new-entry/on-submit",
}

export const StateValue = {
  effectValNoEffect: "noEffect" as EffectValueNoEffect,
  effectValHasEffects: "hasEffects" as EffectValueHasEffects,
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
  date = typeof date === "string" ? parseISO(date) : date;
  return dateFnFormat(date, ISO_DATE_TIME_FORMAT);
}

export function formObjToString(type: DataTypes, val: FormObjVal) {
  let toString = val;

  switch (type) {
    case DataTypes.DATE:
      {
        toString = toISODateString(val as Date);
      }

      break;

    case DataTypes.DATETIME:
      {
        toString = toISODatetimeString(val as Date);
      }

      break;

    case DataTypes.DECIMAL:
    case DataTypes.INTEGER:
      {
        toString = (val || 0) + "";
      }

      break;

    case DataTypes.SINGLE_LINE_TEXT:
      {
        toString = val;
      }
      break;

    case DataTypes.MULTI_LINE_TEXT:
      {
        toString = (val as string).replace(NEW_LINE_REGEX, "\\\\n");
      }

      break;
  }

  return (toString as string).trim();
}

export function makePageTitle(exp: ExperienceFragment | null | undefined) {
  return "[New Entry] " + ((exp && exp.title) || "entry");
}

export function formFieldNameFromIndex(index: number) {
  return `fields[${index}]`;
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer<StateMachine, Action>(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.onRender.value = StateValue.effectValNoEffect;

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

          case ActionType.PUT_EFFECT_FUNCTIONS_ARGS:
            handlePutEffectFunctionsArgs(proxy, payload as EffectFunctionsArgs);
            break;
        }
      });
    },

    // true,
  );

export function interpretMutationException(payload: Error) {
  if (payload instanceof ApolloError) {
    const { graphQLErrors, networkError } = payload;

    if (networkError) {
      return "Network error!";
    }
    return graphQLErrors[0].message;
  }

  return "Unknown error!";
}

////////////////////////// EFFECTS SECTION ////////////////////////////

export type CleanUpQueriesState = RunOnceEffectState<CleanUpQueriesEffect>;

const cleanupQueriesEffect: CleanUpQueriesEffect["func"] = ({
  cache,
  persistor,
}) => {
  return () =>
    cleanupRanQueriesFromCache(
      cache,
      [
        QUERY_NAME_getExperience + "(",
        MUTATION_NAME_createEntry,
        MUTATION_NAME_createOfflineEntry,
      ],
      persistor,
    );
};

type CleanUpQueriesEffect = EffectDefinition<
  "cleanupQueries",
  "cache" | "persistor"
>;

const createEntryEffect: CreateEntryEffect["func"] = async (
  {
    createOnlineEntry,
    createOfflineEntry,
    persistor,
    dispatch,
    goToExperience,
  },
  { experience, input },
) => {
  const experienceId = experience.id;

  try {
    let createResult: CreateOnlineEntryMutation_createEntry;

    if (isConnected()) {
      const result = await createOnlineEntry({
        variables: {
          input,
        },

        update: updateExperienceWithNewEntry(experienceId, persistor),
      });

      createResult = ((result && result.data && result.data.createEntry) ||
        {}) as CreateOnlineEntryMutation_createEntry;
    } else {
      const result = await createOfflineEntry({
        variables: {
          experience,
          dataObjects: input.dataObjects as CreateDataObject[],
        },
      });

      const { entry } = (result &&
        result.data &&
        result.data
          .createOfflineEntry) as CreateOfflineEntryMutationReturned["createOfflineEntry"];

      createResult = { entry } as CreateOnlineEntryMutation_createEntry;
    }

    const { entry, errors } = createResult;

    if (errors) {
      dispatch({ type: ActionType.ON_CREATE_ENTRY_ERRORS, ...errors });
      return;
    }

    if (entry) {
      goToExperience();
    }
  } catch (errors) {
    dispatch({
      type: ActionType.ON_CREATE_ENTRY_EXCEPTION,
      key: StateValue.nonFieldErrors,
      value: interpretMutationException(errors),
    });
  }
};

type CreateEntryEffect = EffectDefinition<
  "createEntry",
  | "persistor"
  | "dispatch"
  | "createOnlineEntry"
  | "createOfflineEntry"
  | "goToExperience",
  {
    experience: ExperienceFragment;
    input: CreateEntryInput;
  }
>;

const scrollToViewEffect: ScrollToViewEffect["func"] = ({}, { id }) => {
  scrollIntoView(id, {
    behavior: "smooth",
  });
};

type ScrollToViewEffect = EffectDefinition<
  "scrollToView",
  "dispatch",
  {
    id: string;
  }
>;

export const effectFunctions = {
  createEntry: createEntryEffect,
  scrollToView: scrollToViewEffect,
  cleanupQueries: cleanupQueriesEffect,
};

export function runEffects(
  effects: EffectsList,
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
////////////////////////// END EFFECTS SECTION ////////////////////////////

////////////////////////// STATE UPDATE SECTION ////////////////////////////

export function initState({
  experience,
  effectsArgsObj,
}: {
  experience: ExperienceFragment;
  effectsArgsObj: EffectFunctionsArgs;
}): StateMachine {
  const dataDefinitions = experience.dataDefinitions as ExperienceFragment_dataDefinitions[];

  const formFields = dataDefinitions.reduce(
    (acc, definition, index) => {
      const value =
        definition.type === DataTypes.DATE ||
        definition.type === DataTypes.DATETIME
          ? new Date()
          : "";

      acc[index] = {
        context: { definition, value },
      };

      return acc;
    },
    {} as FormFields,
  );

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
      onRender: {
        value: StateValue.effectValNoEffect,
      },
      runOnce: {},
      context: {
        effectsArgsObj,
      },
    },
  };
}

function handlePutEffectFunctionsArgs(
  globalState: StateMachine,
  payload: EffectFunctionsArgs,
) {
  const effectsArgsObj = globalState.effects.context.effectsArgsObj;
  globalState.effects.context.effectsArgsObj = {
    ...effectsArgsObj,
    ...payload,
  };

  globalState.effects.runOnce.cleanupQueries = {
    run: true,
    effect: {
      key: "cleanupQueries",
      effectArgKeys: ["cache", "persistor"],
      ownArgs: {},
    },
  };
}

async function handleSubmittingAction(stateMachine: ProxyState) {
  const {
    context: { experience },
    states,
  } = stateMachine;

  states.submitting.value = StateValue.active;
  const { dataDefinitions, id: experienceId } = experience;
  const { form } = states;

  const dataObjects = dataObjectsFromFormValues(
    form.fields,
    dataDefinitions as ExperienceFragment_dataDefinitions[],
  );

  const [effects] = getRenderEffects(stateMachine);

  effects.push({
    key: "createEntry",
    effectArgKeys: [
      "dispatch",
      "createOnlineEntry",
      "createOfflineEntry",
      "goToExperience",
      "persistor",
    ],
    ownArgs: {
      experience,
      input: {
        experienceId,
        dataObjects,
      },
    },
  });
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
    return;
  }

  const fieldErrors = dataObjectsErrors.reduce((acc, field) => {
    const {
      errors,
      index,
    } = field as CreateOnlineEntryMutation_createEntry_errors_dataObjectsErrors;

    acc[index] = Object.entries(errors).reduce((a, [k, v]) => {
      if (v && k !== "__typename") {
        a += `\n${k}: ${v}`;
      }

      return a;
    }, "");

    return acc;
  }, {});

  submitting.errors = {
    value: StateValue.fieldErrors,
    fieldErrors: {
      context: {
        errors: fieldErrors,
      },
    },
  };

  const [effects] = getRenderEffects(stateMachine);

  effects.push({
    key: "scrollToView",
    effectArgKeys: [],
    ownArgs: {
      id: getFieldErrorScrollToId(fieldErrors),
    },
  });
}

function handleOnServerErrorsAction(
  stateMachine: ProxyState,
  payload: ServerErrors,
) {
  const { states } = stateMachine;
  const submitting = states.submitting as SubmittingErrors;
  submitting.value = StateValue.errors;
  const [effects] = getRenderEffects(stateMachine);

  if (payload.key === StateValue.fieldErrors) {
    const fieldErrors = payload.value;
    submitting.errors = {
      value: StateValue.fieldErrors,
      fieldErrors: {
        context: {
          errors: fieldErrors,
        },
      },
    };

    effects.push({
      key: "scrollToView",
      effectArgKeys: [],
      ownArgs: {
        id: getFieldErrorScrollToId(fieldErrors),
      },
    });

    return;
  }

  if (payload.key === StateValue.nonFieldErrors) {
    submitting.errors = {
      value: StateValue.nonFieldErrors,
      nonFieldErrors: {
        context: {
          errors: payload.value,
        },
      },
    };

    effects.push({
      key: "scrollToView",
      effectArgKeys: [],
      ownArgs: {
        id: scrollIntoViewNonFieldErrorDomId,
      },
    });
  }
}

function getFieldErrorScrollToId(fieldErrors: FieldErrors) {
  const [keyVal] = Object.entries(fieldErrors);

  const [id] = keyVal;
  return makeFieldErrorDomId(id);
}

function getRenderEffects(globalState: StateMachine) {
  const renderEffects = globalState.effects.onRender as EffectState;
  renderEffects.value = StateValue.effectValHasEffects;
  const effects: EffectsList = [];
  const cleanupEffects: EffectsList = [];
  renderEffects.hasEffects = {
    context: {
      effects: effects,
      cleanupEffects: cleanupEffects,
    },
  };

  return [effects, cleanupEffects];
}

function dataObjectsFromFormValues(
  formFields: StateMachine["states"]["form"]["fields"],
  dataDefinitions: ExperienceFragment_dataDefinitions[],
) {
  return Object.entries(formFields).reduce(
    (acc, [stringIndex, field]) => {
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
    },
    [] as CreateDataObject[],
  );
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

export type NewEntryComponentProps = NewEntryCallerProps &
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

type ServerErrors =
  | { key: FieldErrorsValue; value: FieldErrors }
  | { key: NonFieldErrorsValue; value: string };

type ProxyState = Draft<StateMachine>;

export interface StateMachine {
  readonly context: {
    readonly experience: ExperienceFragment;
  };
  readonly effects: ({
    readonly onRender: EffectState | { value: EffectValueNoEffect };
    readonly runOnce: {
      cleanupQueries?: CleanUpQueriesState;
    };
  }) & {
    readonly context: EffectContext;
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
  | {
      type: ActionType.ON_CREATE_ENTRY_ERRORS;
    } & CreateOnlineEntryMutation_createEntry_errors
  | {
      type: ActionType.PUT_EFFECT_FUNCTIONS_ARGS;
    } & EffectFunctionsArgs
  | {
      type: ActionType.ON_FORM_FIELD_CHANGED;
    } & FieldChangedPayload
  | {
      type: ActionType.ON_CREATE_ENTRY_EXCEPTION;
    } & ServerErrors;

export type DispatchType = Dispatch<Action>;

////////////////////////// STRINGY TYPES SECTION /////////////
type EffectValueNoEffect = "noEffect";
type EffectValueHasEffects = "hasEffects";
type InActiveValue = "inactive";
type ActiveValue = "active";
type FieldErrorsValue = "fieldErrors";
type NonFieldErrorsValue = "nonFieldErrors";
type ErrorsStateValue = "errors";
/////////////////////// END STRINGY TYPES SECTION /////////////

interface EffectContext {
  effectsArgsObj: EffectFunctionsArgs;
}

type EffectsList = (
  | CleanUpQueriesEffect
  | ScrollToViewEffect
  | CreateEntryEffect)[];

interface EffectState {
  value: EffectValueHasEffects;
  hasEffects: {
    context: {
      effects: EffectsList;
      cleanupEffects: EffectsList;
    };
  };
}

export interface EffectFunctionsArgs
  extends CreateOnlineEntryMutationComponentProps,
    CreateOfflineEntryMutationComponentProps {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
  client: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
  cache: any;
  dispatch: DispatchType;
  goToExperience: () => void;
  persistor: AppPersistor;
}

interface EffectDefinition<
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
