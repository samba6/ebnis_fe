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
  FormObjVal,
  makePageTitle,
  reducer,
  DispatchType,
  ActionType,
  initState,
  NewEntryCallerProps,
  StateValue,
  SubmittingState,
  FieldState,
  runEffects,
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
  makeFormFieldSelectorClass,
} from "./new-entry.dom";
import { Loading } from "../Loading/loading";
import { MUTATION_NAME_createEntry } from "../../graphql/create-entry.mutation";
import { cleanupRanQueriesFromCache } from "../../apollo-cache/cleanup-ran-queries-from-cache";
import {
  QUERY_NAME_getExperience,
  MUTATION_NAME_createOfflineEntry,
} from "../../state/resolvers";

export function NewEntryComponent(props: NewEntryComponentProps) {
  const { navigate, experience, ...rest } = props;
  const { client } = rest;

  const [stateMachine, dispatch] = useReducer(reducer, experience, initState);

  const {
    states: { submitting, form },
    effects: { onRender },
  } = stateMachine;

  const pageTitle = makePageTitle(experience);

  const goToExperience = useCallback(() => {
    (navigate as NavigateFn)(makeExperienceRoute(experience.id));
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  useEffect(() => {
    if (onRender.value !== StateValue.hasEffects) {
      return;
    }

    const {
      hasEffects: { context },
    } = onRender;

    runEffects(context.effects, props, { dispatch, goToExperience });

    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [onRender]);

  useEffect(() => {
    const { cache, persistor } = props;
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
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  useLayoutEffect(() => {
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
                fieldState={form.fields[index]}
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
  function DataComponentFn(props: DataComponentProps) {
    const { definition, index, dispatch, fieldState, submittingState } = props;

    const { name: fieldTitle, type, id } = definition;
    const currentValue = fieldState.context.value;
    const inputId = makeFieldInputId(id);

    const generic = {
      id: inputId,
      name: inputId,
      value: currentValue,
      onChange:
        type === DataTypes.DATE || type === DataTypes.DATETIME
          ? makeDateChangedFn(dispatch, index)
          : (_: E, { value: inputVal }: InputOnChangeData) => {
              dispatch({
                type: ActionType.ON_FORM_FIELD_CHANGED,
                fieldIndex: index,
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
        className={makeClassNames({
          error: !!error,
          "form-field": true,
          [makeFormFieldSelectorClass(id)]: true,
        })}
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
      prevProps.fieldState === nextProps.fieldState &&
      prevProps.submittingState === nextProps.submittingState
    );
  },
);

function makeDateChangedFn(dispatch: DispatchType, index: number) {
  return function makeDateChangedFnInner(fieldName: string, value: FormObjVal) {
    dispatch({
      type: ActionType.ON_FORM_FIELD_CHANGED,
      fieldIndex: index,
      value,
    });
  };
}

interface DataComponentProps {
  definition: ExperienceFragment_dataDefinitions;
  index: number;
  fieldState: FieldState;
  dispatch: DispatchType;
  submittingState: SubmittingState;
}

type E = React.ChangeEvent<HTMLInputElement>;

// istanbul ignore next:
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
