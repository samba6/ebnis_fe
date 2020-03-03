import React, { useEffect, useReducer, useContext, useCallback } from "react";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { NavigateFn } from "@reach/router";
import "./new-entry.styles.scss";
import {
  ComponentProps,
  FormObjVal,
  makePageTitle,
  reducer,
  DispatchType,
  ActionType,
  initState,
  NewEntryCallerProps,
  StateValue,
  FieldState,
  runEffects,
} from "./new-entry.utils";
import { makeExperienceRoute } from "../../constants/experience-route";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { ExperienceFragment_dataDefinitions } from "../../graphql/apollo-types/ExperienceFragment";
import makeClassNames from "classnames";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";
import { useCreateOfflineEntryMutation } from "./new-entry.resolvers";
import { componentFromDataType } from "./component-from-data-type";
import { InputOnChangeData } from "semantic-ui-react";
import { addNewEntryResolvers } from "./new-entry.injectables";
import { EbnisAppContext } from "../../context";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import {
  submitBtnDomId,
  scrollIntoViewNonFieldErrorDomId,
  makeFieldInputId,
  makeInputErrorDomId,
} from "./new-entry.dom";
import { Loading } from "../Loading/loading";
import { cleanupRanQueriesFromCache } from "../../apollo-cache/cleanup-ran-queries-from-cache";
import {
  QUERY_NAME_getExperience,
  MUTATION_NAME_createOfflineEntry,
} from "../../state/resolvers";
import { useUpdateExperiencesOnlineMutation } from "../../graphql/experiences.mutation";

export function NewEntryComponent(props: ComponentProps) {
  const { navigate, experience } = props;
  const [stateMachine, dispatch] = useReducer(reducer, experience, initState);

  const {
    states: { submission, form },
    effects: { general: generalEffects },
  } = stateMachine;

  const pageTitle = makePageTitle(experience);

  const goToExperience = useCallback(() => {
    (navigate as NavigateFn)(makeExperienceRoute(experience.id));
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  useEffect(() => {
    if (generalEffects.value !== StateValue.hasEffects) {
      return;
    }

    const {
      hasEffects: { context },
    } = generalEffects;

    runEffects(context.effects, props, { dispatch, goToExperience });

    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [generalEffects]);

  useEffect(() => {
    const { client, cache, persistor } = props;
    setDocumentTitle(makeSiteTitle(pageTitle));
    addNewEntryResolvers(client);

    return () =>
      cleanupRanQueriesFromCache(
        cache,
        [QUERY_NAME_getExperience + "(", MUTATION_NAME_createOfflineEntry],
        persistor,
      );

    setDocumentTitle();
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  const onSubmit = useCallback(() => {
    dispatch({
      type: ActionType.ON_SUBMIT,
    });
  }, []);

  const { dataDefinitions, title } = experience;

  return (
    <div className="component-new-entry">
      {submission.value === StateValue.active && <Loading />}

      <SidebarHeader title={pageTitle} sidebar={true} />

      <div className="main">
        {submission.value === StateValue.errors && (
          <span
            className="js-scroll-into-view"
            id={scrollIntoViewNonFieldErrorDomId}
          />
        )}

        <Button
          type="button"
          onClick={goToExperience}
          className="title"
          basic={true}
        >
          {title}
        </Button>

        {submission.value === StateValue.errors && (
          <div className="notification">
            <span className="text">{submission.errors.context.errors}</span>

            <div
              id="close-notification"
              className="close__container"
              onClick={() => {
                dispatch({ type: ActionType.DISMISS_NOTIFICATION });
              }}
            >
              <button className="pointer-events-none close" />
            </div>
          </div>
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
    const {
      definition,
      index,
      dispatch,
      fieldState: {
        context: { value: currentValue, errors },
      },
    } = props;

    const { name: fieldTitle, type, id } = definition;
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

    return (
      <Form.Field
        className={makeClassNames({
          error: !!errors,
          relative: true,
        })}
      >
        <label htmlFor={inputId}>{`[${type}] ${fieldTitle}`}</label>

        {component}

        {errors && (
          <FormCtrlError id={makeInputErrorDomId(id)}>{errors}</FormCtrlError>
        )}
      </Form.Field>
    );
  },

  function DataComponentDiff(prevProps, nextProps) {
    return prevProps.fieldState === nextProps.fieldState;
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
}

type E = React.ChangeEvent<HTMLInputElement>;

// istanbul ignore next:
export default (props: NewEntryCallerProps) => {
  const [createOfflineEntry] = useCreateOfflineEntryMutation();
  const { cache, client, persistor } = useContext(EbnisAppContext);
  const [updateExperiencesOnline] = useUpdateExperiencesOnlineMutation();

  return (
    <NewEntryComponent
      createOfflineEntry={createOfflineEntry}
      updateExperiencesOnline={updateExperiencesOnline}
      client={client}
      persistor={persistor}
      cache={cache}
      {...props}
    />
  );
};
