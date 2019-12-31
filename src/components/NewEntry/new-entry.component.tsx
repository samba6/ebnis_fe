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
  initialStateFromProps,
  NewEntryCallerProps,
  EffectFunctionsArgs,
  StateValue,
  runEffects,
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
import { useDeleteCachedQueriesAndMutationsOnUnmount } from "../use-delete-cached-queries-mutations-on-unmount";
import {
  MUTATION_NAME_createEntry,
  useCreateOnlineEntryMutation,
} from "../../graphql/create-entry.mutation";
import {
  MUTATION_NAME_createOfflineEntry,
  QUERY_NAME_getExperience,
} from "../../state/resolvers";

export function NewEntryComponent(props: NewEntryComponentProps) {
  const {
    client,
    navigate,
    experience,
    createOnlineEntry,
    createOfflineEntry,
  } = props;

  const [stateMachine, dispatch] = useReducer(
    reducer,
    {
      experience,
      effectsArgsObj: {
        client,
        createOnlineEntry,
        createOfflineEntry,
      } as EffectFunctionsArgs,
    },
    initialStateFromProps,
  );

  const {
    fieldErrors,
    networkError,

    effects: {
      runOnRenders,
      context: { effectsArgsObj },
    },
  } = stateMachine;

  const pageTitle = makePageTitle(experience);

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

  // we use getExperience( instead of getExperience so that getExperiences does
  // not get deleted
  useDeleteCachedQueriesAndMutationsOnUnmount(
    [
      QUERY_NAME_getExperience + "(",
      MUTATION_NAME_createEntry,
      MUTATION_NAME_createOfflineEntry,
    ],
    true,
  );

  const onSubmit = useCallback(() => {
    dispatch({
      type: ActionType.SUBMITTING,
    });
  }, []);

  function renderMain() {
    const { dataDefinitions, title } = experience;

    return (
      <div className="main">
        <Button
          type="button"
          onClick={goToExperience}
          className="title"
          basic={true}
        >
          {title}
        </Button>

        {networkError && (
          <Message
            style={{
              minHeight: "auto",
              position: "relative",
              marginTop: 0,
            }}
            id="new-entry-network-error"
            error={true}
            onDismiss={function onDismiss() {
              dispatch({ type: ActionType.removeServerErrors });
            }}
          >
            <Message.Content>
              <span
                className="js-scroll-into-view"
                id="js-scroll-into-view-network-error"
              />

              {networkError}
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
                formValues={stateMachine.formObj}
                dispatch={dispatch}
                error={fieldErrors[index]}
              />
            );
          })}

          <Button
            className="submit-btn"
            id="new-entry-submit-btn"
            type="submit"
            inverted={true}
            color="green"
            fluid={true}
          >
            Submit
          </Button>
        </Form>
      </div>
    );
  }

  return (
    <div className="component-new-entry">
      <SidebarHeader title={pageTitle} sidebar={true} />

      {renderMain()}
    </div>
  );
}

const DataComponent = React.memo(
  function FieldComponentFn(props: DataComponentProps) {
    const { definition, index, dispatch, formValues, error } = props;

    const { name: fieldTitle, type, id } = definition;
    const formFieldName = formFieldNameFromIndex(index);
    const value = formValues[index] as FormObjVal;

    let inputId = `new-entry-${type}-input`;

    const generic = {
      id: inputId,
      name: formFieldName,
      value,
      onChange:
        type === DataTypes.DATE || type === DataTypes.DATETIME
          ? makeDateChangedFn(dispatch)
          : (_: E, { value: inputVal }: InputOnChangeData) => {
              dispatch({
                type: ActionType.setFormObjField,
                formFieldName,
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
        key={id}
        className={makeClassNames({ error: !!error, "form-field": true })}
      >
        <span id={makeScrollIntoViewId(id)} className="js-scroll-into-view" />

        <label htmlFor={inputId}>{`[${type}] ${fieldTitle}`}</label>

        {component}

        {error && (
          <FormCtrlError error={error} id={`new-entry-field-error-${id}`} />
        )}
      </Form.Field>
    );
  },

  function FieldComponentDiff(prevProps, nextProps) {
    const { formValues: prevFormValues, error: currentError } = prevProps;
    const { formValues: nextFormValues, error: nextError } = nextProps;

    const prevVal = prevFormValues[prevProps.index];

    const nextVal = nextFormValues[nextProps.index];

    return prevVal === nextVal && currentError === nextError;
  },
);

function makeDateChangedFn(dispatch: DispatchType) {
  return function makeDateChangedFnInner(fieldName: string, value: FormObjVal) {
    dispatch({
      type: ActionType.setFormObjField,
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
  error?: string;
}

type E = React.ChangeEvent<HTMLInputElement>;

// istanbul ignore next:
export default (props: NewEntryCallerProps) => {
  const [createOnlineEntry] = useCreateOnlineEntryMutation();
  const [createOfflineEntry] = useCreateOfflineEntryMutation();
  const { client } = useContext(EbnisAppContext);

  return (
    <NewEntryComponent
      createOnlineEntry={createOnlineEntry}
      createOfflineEntry={createOfflineEntry}
      client={client}
      {...props}
    />
  );
};
