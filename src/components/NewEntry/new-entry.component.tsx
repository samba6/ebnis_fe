import React, {
  useEffect,
  useReducer,
  useContext,
  useLayoutEffect,
  useCallback,
} from "react";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { NavigateFn } from "@reach/router";
import "./new-entry.styles.scss";
import {
  NewEntryComponentProps,
  FormObj,
  FormObjVal,
  makePageTitle,
  formFieldNameFromIndex,
  reducer,
  DispatchType,
  ActionType,
  initState,
  NewEntryCallerProps,
  EffectFunctionsArgs,
  StateValue,
  runEffects,
  CleanUpQueriesState,
  getEffectArgsFromKeys,
  effectFunctions,
  SubmittingState,
  // getEffectArgsFromKeys,
} from "./new-entry.utils";
import { makeExperienceRoute } from "../../constants/experience-route";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { ExperienceFragment_dataDefinitions } from "../../graphql/apollo-types/ExperienceFragment";
import makeClassNames from "classnames";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import { makeScrollIntoViewId } from "../scroll-into-view";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";
import { useCreateOfflineEntryMutation } from "./new-entry.resolvers";
import { componentFromDataType } from "./component-from-data-type";
import { InputOnChangeData } from "semantic-ui-react";
import { addResolvers } from "./new-entry.injectables";
import { EbnisAppContext } from "../../context";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { useCreateOnlineEntryMutation } from "../../graphql/create-entry.mutation";
import {
  submitBtnDomId,
  makeFieldErrorDomId,
  networkErrorDomId,
  scrollIntoViewNonFieldErrorDomId,
  makeFieldInputId,
} from "./new-entry.dom";
import { Loading } from "../Loading/loading";

export function NewEntryComponent(props: NewEntryComponentProps) {
  const { navigate, experience, ...rest } = props;
  const { client } = rest;

  const [stateMachine, dispatch] = useReducer(
    reducer,
    {
      experience,
      effectsArgsObj: rest as EffectFunctionsArgs,
    },
    initState,
  );

  const {
    states: { submitting },
    effects: {
      onRender: runOnRenders,
      runOnce: { cleanupQueries },
      context: { effectsArgsObj },
    },
  } = stateMachine;

  const pageTitle = makePageTitle(experience);
  const runCleanupQueriesEffect = cleanupQueries && cleanupQueries.run;

  useEffect(() => {
    if (runOnRenders.value !== StateValue.effectValHasEffects) {
      return;
    }

    const {
      hasEffects: { context },
    } = runOnRenders;

    runEffects(context.effects, effectsArgsObj);

    const { cleanupEffects } = context;

    if (cleanupEffects.length) {
      return () => {
        runEffects(cleanupEffects, effectsArgsObj);
      };
    }

    // redundant - [tsserver 7030] [W] Not all code paths return a value.
    return;

    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [runOnRenders]);

  useEffect(() => {
    if (runCleanupQueriesEffect) {
      const {
        effect: { key, effectArgKeys, ownArgs },
      } = cleanupQueries as CleanUpQueriesState;

      const args = getEffectArgsFromKeys(effectArgKeys, effectsArgsObj);

      return effectFunctions[key](
        args,
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        ownArgs as any,
      ) as (() => void);
    }

    // redundant - [tsserver 7030] [W] Not all code paths return a value.
    return;

    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [runCleanupQueriesEffect]);

  const goToExperience = useCallback(() => {
    (navigate as NavigateFn)(makeExperienceRoute(experience.id));
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  useLayoutEffect(() => {
    const args = { dispatch, goToExperience } as EffectFunctionsArgs;

    dispatch({
      type: ActionType.PUT_EFFECT_FUNCTIONS_ARGS,
      ...args,
    });
    addResolvers(client);
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(pageTitle));

      return setDocumentTitle;
    },
    [pageTitle],
  );

  const onSubmit = useCallback(() => {
    dispatch({
      type: ActionType.ON_SUBMIT,
    });
  }, []);

  const { dataDefinitions, title } = experience;

  return (
    <div className="component-new-entry">
      {submitting.value === StateValue.active && <Loading />}

      <SidebarHeader title={pageTitle} sidebar={true} />

      <div className="main">
        <Button
          type="button"
          onClick={goToExperience}
          className="title"
          basic={true}
        >
          {title}
        </Button>

        {submitting.value === StateValue.errors &&
          submitting.errors.value === StateValue.nonFieldErrors && (
            <Message
              style={{
                minHeight: "auto",
                position: "relative",
                marginTop: 0,
              }}
              id={networkErrorDomId}
              error={true}
              onDismiss={function onDismiss() {
                dispatch({ type: ActionType.DISMISS_SERVER_ERRORS });
              }}
            >
              <Message.Content>
                <span
                  className="js-scroll-into-view"
                  id={scrollIntoViewNonFieldErrorDomId}
                />

                {submitting.errors.nonFieldErrors.context.errors}
              </Message.Content>
            </Message>
          )}

        <Form onSubmit={onSubmit}>
          {dataDefinitions.map((obj, index) => {
            const definition = obj as ExperienceFragment_dataDefinitions;

            return (
              <DataComponent
                key={definition.id}
                definition={definition}
                index={index}
                formValues={stateMachine.states.form}
                dispatch={dispatch}
                submittingState={submitting}
              />
            );
          })}

          <Button
            className="submit-btn"
            id={submitBtnDomId}
            type="submit"
            inverted={true}
            color="green"
            fluid={true}
          >
            Submit
          </Button>
        </Form>
      </div>
    </div>
  );
}

const DataComponent = React.memo(
  function FieldComponentFn(props: DataComponentProps) {
    const { definition, index, dispatch, formValues, submittingState } = props;

    const { name: fieldTitle, type, id } = definition;
    const formFieldName = formFieldNameFromIndex(index);
    const value = formValues[index] as FormObjVal;
    const inputId = makeFieldInputId(type);

    const generic = {
      id: inputId,
      name: formFieldName,
      value,
      onChange:
        type === DataTypes.DATE || type === DataTypes.DATETIME
          ? makeDateChangedFn(dispatch)
          : (_: E, { value: inputVal }: InputOnChangeData) => {
              dispatch({
                type: ActionType.ON_FORM_FIELD_CHANGED,
                formFieldName,
                value:
                  type === DataTypes.DECIMAL || type === DataTypes.INTEGER
                    ? Number(inputVal)
                    : inputVal,
              });
            },
    };

    const component = componentFromDataType(type, generic);
    let error = "";

    if (
      submittingState.value === StateValue.errors &&
      submittingState.errors.value === StateValue.fieldErrors
    ) {
      error = submittingState.errors.fieldErrors.context.errors[index];
    }

    return (
      <Form.Field
        key={id}
        className={makeClassNames({ error: !!error, "form-field": true })}
      >
        <span id={makeScrollIntoViewId(id)} className="js-scroll-into-view" />

        <label htmlFor={inputId}>{`[${type}] ${fieldTitle}`}</label>

        {component}

        {error && (
          <FormCtrlError error={error} id={makeFieldErrorDomId(index)} />
        )}
      </Form.Field>
    );
  },

  function DataComponentDiff(prevProps, nextProps) {
    return (
      prevProps.formValues[prevProps.index] ===
        nextProps.formValues[nextProps.index] &&
      prevProps.submittingState === nextProps.submittingState
    );
  },
);

function makeDateChangedFn(dispatch: DispatchType) {
  return function makeDateChangedFnInner(fieldName: string, value: FormObjVal) {
    dispatch({
      type: ActionType.ON_FORM_FIELD_CHANGED,
      formFieldName: fieldName,
      value,
    });
  };
}

interface DataComponentProps {
  definition: ExperienceFragment_dataDefinitions;
  index: number;
  formValues: FormObj;
  dispatch: DispatchType;
  submittingState: SubmittingState;
}

type E = React.ChangeEvent<HTMLInputElement>;

// ist ignore next:
export default (props: NewEntryCallerProps) => {
  const [createOnlineEntry] = useCreateOnlineEntryMutation();
  const [createOfflineEntry] = useCreateOfflineEntryMutation();
  const { cache, client, persistor } = useContext(EbnisAppContext);

  return (
    <NewEntryComponent
      createOnlineEntry={createOnlineEntry}
      createOfflineEntry={createOfflineEntry}
      client={client}
      persistor={persistor}
      cache={cache}
      {...props}
    />
  );
};
