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
import { scrollIntoView, makeScrollIntoViewId } from "../scroll-into-view";
import { AppPersistor } from "../../context";
import { cleanupRanQueriesFromCache } from "../../apollo-cache/cleanup-ran-queries-from-cache";
import { InMemoryCache } from "apollo-cache-inmemory";
import {
  QUERY_NAME_getExperience,
  MUTATION_NAME_createOfflineEntry,
} from "../../state/resolvers";

const NEW_LINE_REGEX = /\n/g;
export const ISO_DATE_FORMAT = "yyyy-MM-dd";
const ISO_DATE_TIME_FORMAT = ISO_DATE_FORMAT + "'T'HH:mm:ssXXX";

export enum ActionType {
  setFormObjField = "@components/new-entry/set-form-obj-field",
  ON_SERVER_ERRORS = "@components/new-entry/set-server-errors",
  ON_CREATE_ENTRY_ERRORS = "@components/new-entry/set-create-entry-errors",
  removeServerErrors = "@components/new-entry/unset-server-errors",
  PUT_EFFECT_FUNCTIONS_ARGS = "@components/new-entry/put-effects-functions-args",
  SUBMITTING = "@components/new-entry/submitting",
}

export const StateValue = {
  effectValNoEffect: "noEffect" as EffectValueNoEffect,
  effectValHasEffects: "hasEffects" as EffectValueHasEffects,
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

function formFieldNameToIndex(formFieldName: string) {
  const index = (/fields.+(\d+)/.exec(formFieldName) as RegExpExecArray)[1];

  return index;
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer<StateMachine, Action>(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.onRender.value = StateValue.effectValNoEffect;

        switch (type) {
          case ActionType.setFormObjField:
            {
              const {
                formFieldName,
                value,
              } = payload as SetFormObjFieldPayload;

              proxy.formObj[formFieldNameToIndex(formFieldName)] = value;
            }

            break;

          case ActionType.SUBMITTING:
            handleSubmittingAction(proxy);
            break;

          case ActionType.ON_CREATE_ENTRY_ERRORS:
            handleOnCreateEntryErrors(
              proxy,
              payload as CreateOnlineEntryMutation_createEntry_errors,
            );
            break;

          case ActionType.ON_SERVER_ERRORS:
            handleOnServerErrors(proxy, payload as ServerErrors);
            break;

          case ActionType.removeServerErrors:
            {
              proxy.networkError = null;
              proxy.fieldErrors = {};
            }
            break;

          case ActionType.PUT_EFFECT_FUNCTIONS_ARGS:
            handlePutEffectFunctionsArgs(proxy, payload as EffectFunctionsArgs);
            break;
        }
      });
    },

    // true,
  );

export function parseApolloErrors(payload: ApolloError) {
  const { graphQLErrors, networkError } = payload as ApolloError;

  if (networkError) {
    return { networkError: "Network error!" };
  }
  return { networkError: graphQLErrors[0].message };
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
    const parsedErrors = parseApolloErrors(errors);

    dispatch({ type: ActionType.ON_SERVER_ERRORS, ...parsedErrors });

    if (parsedErrors.networkError) {
      scrollIntoView("js-scroll-into-view-network-error");
    }
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

const scrollToFirstFieldErrorEffect: ScrollToFirstFieldErrorEffect["func"] = (
  {},
  { fieldErrors },
) => {
  const [keyVal] = Object.entries(fieldErrors);

  if (!keyVal) {
    return;
  }

  const [id] = keyVal;

  scrollIntoView(makeScrollIntoViewId(id), {
    behavior: "smooth",
  });
};

type ScrollToFirstFieldErrorEffect = EffectDefinition<
  "scrollToFirstFieldError",
  "dispatch",
  {
    fieldErrors: FieldErrors;
  }
>;

export const effectFunctions = {
  createEntry: createEntryEffect,
  scrollToFirstFieldError: scrollToFirstFieldErrorEffect,
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

export function initialStateFromProps({
  experience,
  effectsArgsObj,
}: {
  experience: ExperienceFragment;
  effectsArgsObj: EffectFunctionsArgs;
}): StateMachine {
  const dataDefinitions = experience.dataDefinitions as ExperienceFragment_dataDefinitions[];

  const formObj = dataDefinitions.reduce(
    function fieldDefReducer(acc, definition, index) {
      const value =
        definition.type === DataTypes.DATE ||
        definition.type === DataTypes.DATETIME
          ? new Date()
          : "";

      acc[index] = value;

      return acc;
    },
    {} as FormObj,
  );

  return {
    context: { experience },
    formObj,
    fieldErrors: {},
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

async function handleSubmittingAction(globalState: DraftState) {
  const {
    context: { experience },
    formObj,
  } = globalState;

  const { dataDefinitions, id: experienceId } = experience;

  const dataObjects = dataObjectsFromFormValues(
    formObj,
    dataDefinitions as ExperienceFragment_dataDefinitions[],
  );

  const [effects] = getRenderEffects(globalState);

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
  globalState: DraftState,
  payload: CreateOnlineEntryMutation_createEntry_errors,
) {
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

  globalState.fieldErrors = fieldErrors;

  const [effects] = getRenderEffects(globalState);

  effects.push({
    key: "scrollToFirstFieldError",
    effectArgKeys: [],
    ownArgs: {
      fieldErrors,
    },
  });
}

function handleOnServerErrors(globalState: DraftState, payload: ServerErrors) {
  const { fieldErrors, networkError } = payload as ServerErrors;

  if (fieldErrors) {
    globalState.fieldErrors = fieldErrors;

    const [effects] = getRenderEffects(globalState);

    effects.push({
      key: "scrollToFirstFieldError",
      effectArgKeys: [],
      ownArgs: {
        fieldErrors,
      },
    });
  } else if (networkError) {
    globalState.networkError = networkError;
  }
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
  formObj: StateMachine["formObj"],
  dataDefinitions: ExperienceFragment_dataDefinitions[],
) {
  return Object.entries(formObj).reduce(
    (acc, [stringIndex, val]) => {
      const index = Number(stringIndex);
      const definition = dataDefinitions[
        index
      ] as ExperienceFragment_dataDefinitions;

      const { type, id: definitionId } = definition;

      acc.push({
        definitionId,

        data: `{"${type.toLowerCase()}":"${formObjToString(type, val)}"}`,
      });

      return acc;
    },
    [] as CreateDataObject[],
  );
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
export interface FormObj {
  [k: string]: FormObjVal;
}

export interface FieldComponentProps {
  formFieldName: string;
  dispatch: DispatchType;
  value: FormObjVal;
}

export type ToString = (val: FormObjVal) => string;
interface SetFormObjFieldPayload {
  formFieldName: string;
  value: FormObjVal;
}

interface FieldErrors {
  [k: string]: string;
}

interface ServerErrors {
  networkError?: string;
  fieldErrors?: FieldErrors;
}

type DraftState = Draft<StateMachine>;

export interface StateMachine {
  readonly context: {
    readonly experience: ExperienceFragment;
  };
  readonly formObj: FormObj;
  readonly fieldErrors: FieldErrors;
  readonly networkError?: string | null;
  readonly effects: ({
    onRender: EffectState | { value: EffectValueNoEffect };
    runOnce: {
      cleanupQueries?: CleanUpQueriesState;
    };
  }) & {
    context: EffectContext;
  };
}

interface RunOnceEffectState<IEffect> {
  run: boolean;
  effect: IEffect;
}

type Action =
  | { type: ActionType.SUBMITTING }
  | { type: ActionType.removeServerErrors }
  | {
      type: ActionType.ON_CREATE_ENTRY_ERRORS;
    } & CreateOnlineEntryMutation_createEntry_errors
  | {
      type: ActionType.PUT_EFFECT_FUNCTIONS_ARGS;
    } & EffectFunctionsArgs
  | {
      type: ActionType.setFormObjField;
    } & SetFormObjFieldPayload
  | {
      type: ActionType.ON_SERVER_ERRORS;
    } & ServerErrors;

export type DispatchType = Dispatch<Action>;

type EffectValueNoEffect = "noEffect";
type EffectValueHasEffects = "hasEffects";

interface EffectContext {
  effectsArgsObj: EffectFunctionsArgs;
}

type EffectsList = (
  | CleanUpQueriesEffect
  | ScrollToFirstFieldErrorEffect
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
