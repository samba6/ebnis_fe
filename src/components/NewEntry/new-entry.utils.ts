import { RouteComponentProps } from "@reach/router";
import { Reducer, Dispatch } from "react";
import { NewEntryRouteParams } from "../../routes";
import {
  ExperienceFragment,
  ExperienceFragment_dataDefinitions,
} from "../../graphql/apollo-types/ExperienceFragment";
import immer, { Draft } from "immer";
import ApolloClient from "apollo-client";
import {
  DataTypes,
  CreateEntryInput,
  CreateDataObject,
} from "../../graphql/apollo-types/globalTypes";
import dateFnFormat from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { CreateOfflineEntryMutationComponentProps } from "./new-entry.resolvers";
import { wrapReducer } from "../../logger";
import { isConnected } from "../../state/connections";
import { scrollIntoView } from "../scroll-into-view";
import { AppPersistor } from "../../context";
import { InMemoryCache } from "apollo-cache-inmemory";
import { scrollIntoViewNonFieldErrorDomId } from "./new-entry.dom";
import {
  UpdateExperiencesOnlineComponentProps,
  updateExperiencesOnlineEffectHelperFunc,
} from "../../graphql/experiences.gql";
import {
  CommonErrorPayload,
  parseStringError,
  FORM_CONTAINS_ERRORS_MESSAGE,
} from "../../general-utils";
import {
  CreateEntryErrorFragment,
  CreateEntryErrorFragment_dataObjects,
} from "../../graphql/apollo-types/CreateEntryErrorFragment";
import { NEW_ENTRY_DOCUMENT_TITLE_PREFIX } from "./new-entry.dom";

const NEW_LINE_REGEX = /\n/g;
export const ISO_DATE_FORMAT = "yyyy-MM-dd";
const ISO_DATE_TIME_FORMAT = ISO_DATE_FORMAT + "'T'HH:mm:ssXXX";

export enum ActionType {
  ON_FORM_FIELD_CHANGED = "@new-entry/on-form-field-changed",
  ON_CREATE_ENTRY_ERRORS = "@new-entry/set-create-entry-errors",
  DISMISS_NOTIFICATION = "@new-entry/unset-server-errors",
  ON_SUBMIT = "@new-entry/on-submit",
  ON_COMMON_ERROR = "@new-entry/on-common-error",
}

export const StateValue = {
  noEffect: "noEffect" as NoEffectVal,
  hasEffects: "hasEffects" as HasEffects,
  active: "active" as ActiveValue,
  inactive: "inactive" as InActiveValue,
  errors: "errors" as ErrorsVal,
};

export function toISODateString(date: Date) {
  return dateFnFormat(date, ISO_DATE_FORMAT);
}

export function toISODatetimeString(date: Date | string) {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  const formattedDate = dateFnFormat(parsedDate, ISO_DATE_TIME_FORMAT);
  return formattedDate;
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
      toString = (val || "0") + "";
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
  return NEW_ENTRY_DOCUMENT_TITLE_PREFIX + ((exp && exp.title) || "entry");
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer<StateMachine, Action>(
    state,
    action,
    (prevState, { type, ...payload }) => {
      return immer(prevState, proxy => {
        proxy.effects.general.value = StateValue.noEffect;
        delete proxy.effects.general[StateValue.hasEffects];

        switch (type) {
          case ActionType.ON_FORM_FIELD_CHANGED:
            handleFormFieldChangedAction(proxy, payload as FieldChangedPayload);
            break;

          case ActionType.ON_SUBMIT:
            handleSubmissionAction(proxy);
            break;

          case ActionType.ON_CREATE_ENTRY_ERRORS:
            handleOnCreateEntryErrors(
              proxy,
              payload as CreateEntryErrorFragment,
            );
            break;

          case ActionType.DISMISS_NOTIFICATION:
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

////////////////////////// EFFECTS SECTION ////////////////////////////

export const GENERIC_SERVER_ERROR = "Something went wrong - please try again.";

const createEntryEffect: DefCreateEntryEffect["func"] = async (
  ownArgs,
  props,
  effectArgs,
) => {
  const {
    createOfflineEntry,
    persistor,
    experience: { id: experienceId },
    updateExperiencesOnline,
  } = props;

  const { dispatch, goToExperience } = effectArgs;
  const { input } = ownArgs;

  if (isConnected()) {
    const inputs = [
      {
        experienceId,
        addEntries: [input],
      },
    ];

    updateExperiencesOnlineEffectHelperFunc(
      inputs,
      updateExperiencesOnline,
      async experience => {
        const { newEntries } = experience;

        if (newEntries && newEntries.length) {
          const entry0 = newEntries[0];

          if (entry0.__typename === "CreateEntryErrors") {
            const { errors } = entry0;
            dispatch({
              type: ActionType.ON_CREATE_ENTRY_ERRORS,
              ...errors,
            });

            return;
          }

          await persistor.persist();
          goToExperience();

          return;
        }

        dispatch({
          type: ActionType.ON_COMMON_ERROR,
          error: GENERIC_SERVER_ERROR,
        });
      },
      async () => undefined,
    );
  } else {
    createOfflineEntry({
      variables: {
        experienceId,
        dataObjects: input.dataObjects as CreateDataObject[],
      },
    });

    await persistor.persist();
    goToExperience();
  }
};

interface CreateEntryEffectArgs {
  input: CreateEntryInput;
  onDone?: () => void;
}

type DefCreateEntryEffect = EffectDefinition<
  "createEntryEffect",
  CreateEntryEffectArgs
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
      submission: {
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

function handleSubmissionAction(proxy: DraftState) {
  const {
    context: { experience },
    states,
  } = proxy;

  states.submission.value = StateValue.active;
  const { dataDefinitions, id: experienceId } = experience;
  const {
    form: { fields },
  } = states;

  const dataObjects = dataObjectsFromFormValues(
    fields,
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

function handleOnCreateEntryErrors(
  proxy: DraftState,
  payload: CreateEntryErrorFragment,
) {
  const {
    states: {
      form: { fields },
    },
  } = proxy;
  const { dataObjects } = payload as CreateEntryErrorFragment;

  if (!dataObjects) {
    handleOnCommonErrorAction(proxy, { error: GENERIC_SERVER_ERROR });
    return;
  }

  handleOnCommonErrorAction(proxy, { error: FORM_CONTAINS_ERRORS_MESSAGE });

  dataObjects.forEach(field => {
    const {
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars*/
      __typename,
      meta: { index },
      ...errors
    } = field as CreateEntryErrorFragment_dataObjects;

    const fieldState = fields[index];
    fieldState.context.errors = Object.entries(errors).filter(x => !!x[1]);
  });
}

function handleOnCommonErrorAction(
  proxy: DraftState,
  payload: CommonErrorPayload,
) {
  const errors = parseStringError(payload.error);

  const commonErrorsState = {
    value: StateValue.errors,
    errors: {
      context: {
        errors,
      },
    },
  } as Submission;

  proxy.states.submission = {
    ...proxy.states.submission,
    ...commonErrorsState,
  };

  const effects = getRenderEffects(proxy);
  effects.push({
    key: "scrollToViewEffect",
    ownArgs: {
      id: scrollIntoViewNonFieldErrorDomId,
    },
  });
}

function getRenderEffects(proxy: DraftState) {
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
  return Object.entries(formFields).reduce(
    (acc, [stringIndex, { context }]) => {
      delete context.errors;
      const index = Number(stringIndex);

      const definition = dataDefinitions[
        index
      ] as ExperienceFragment_dataDefinitions;

      const { type, id: definitionId } = definition;

      acc.push({
        definitionId,

        data: `{"${type.toLowerCase()}":"${formObjToString(
          type,
          context.value,
        )}"}`,
      });

      return acc;
    },
    [] as CreateDataObject[],
  );
}

function handleFormFieldChangedAction(
  proxy: DraftState,
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
  UpdateExperiencesOnlineComponentProps &
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
    errors?: [string, string][];
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

type DraftState = Draft<StateMachine>;

interface StateMachine {
  readonly context: {
    readonly experience: ExperienceFragment;
  };
  readonly effects: {
    readonly general: GeneralEffect | { value: NoEffectVal };
  };
  readonly states: {
    readonly submission: Submission;
    readonly form: {
      readonly fields: FormFields;
    };
  };
}

type Submission =
  | SubmissionErrors
  | { value: ActiveValue }
  | {
      value: InActiveValue;
    };

interface SubmissionErrors {
  value: ErrorsVal;
  errors: {
    context: {
      errors: string;
    };
  };
}

interface RunOnceEffectState<IEffect> {
  run: boolean;
  effect: IEffect;
}

type Action =
  | { type: ActionType.ON_SUBMIT }
  | { type: ActionType.DISMISS_NOTIFICATION }
  | ({
      type: ActionType.ON_CREATE_ENTRY_ERRORS;
    } & CreateEntryErrorFragment)
  | ({
      type: ActionType.ON_FORM_FIELD_CHANGED;
    } & FieldChangedPayload)
  | ({
      type: ActionType.ON_COMMON_ERROR;
    } & CommonErrorPayload);

export type DispatchType = Dispatch<Action>;

////////////////////////// STRINGY TYPES SECTION /////////////
type NoEffectVal = "noEffect";
type HasEffects = "hasEffects";
type InActiveValue = "inactive";
type ActiveValue = "active";
type ErrorsVal = "errors";
/////////////////////// END STRINGY TYPES SECTION /////////////

interface EffectContext {
  effectsArgsObj: ComponentProps;
}

type EffectsList = (DefScrollToViewEffect | DefCreateEntryEffect)[];

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
