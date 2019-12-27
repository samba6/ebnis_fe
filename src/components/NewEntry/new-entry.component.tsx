import React, {
  useEffect,
  useReducer,
  useContext,
  useLayoutEffect,
} from "react";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { NavigateFn } from "@reach/router";
import "./new-entry.styles.scss";
import {
  Props,
  FormObj,
  FormObjVal,
  makePageTitle,
  formFieldNameFromIndex,
  reducer,
  DispatchType,
  ActionTypes,
  parseApolloErrors,
  initialStateFromProps,
  State,
  formObjToString,
} from "./new-entry.utils";
import { makeExperienceRoute } from "../../constants/experience-route";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { isConnected } from "../../state/connections";
import { ExperienceFragment_dataDefinitions } from "../../graphql/apollo-types/ExperienceFragment";
import makeClassNames from "classnames";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import { makeScrollIntoViewId, scrollIntoView } from "../scroll-into-view";
import {
  DataTypes,
  CreateDataObject,
} from "../../graphql/apollo-types/globalTypes";
import { CreateEntryMutation_createEntry } from "../../graphql/apollo-types/CreateEntryMutation";
import { CreateOfflineEntryMutationReturned } from "./new-entry.resolvers";
import { componentFromDataType } from "./component-from-data-type";
import { InputOnChangeData } from "semantic-ui-react";
import {
  addResolvers,
  useCreateOnlineEntry,
  useCreateEntryOffline,
  updateExperienceWithNewEntry,
} from "./new-entry.injectables";
import { EbnisAppContext } from "../../context";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { useDeleteCachedQueriesAndMutationsOnUnmount } from "../use-delete-cached-queries-mutations-on-unmount";
import { MUTATION_NAME_createEntry } from "../../graphql/create-entry.mutation";
import { MUTATION_NAME_createOfflineEntry } from "../../state/resolvers";

export function NewEntry(props: Props) {
  const { navigate, experience } = props;
  const [createEntry] = useCreateOnlineEntry();
  const [createOfflineEntry] = useCreateEntryOffline();
  const { client } = useContext(EbnisAppContext);

  const [state, dispatch] = useReducer(
    reducer,
    experience,
    initialStateFromProps,
  );

  const { fieldErrors, networkError } = state;

  const pageTitle = makePageTitle(experience);

  useLayoutEffect(() => {
    addResolvers(client);
  }, [client]);

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(pageTitle));

      return setDocumentTitle;
    },
    [pageTitle],
  );

  useEffect(() => {
    const [keyVal] = Object.entries(fieldErrors);

    if (!keyVal) {
      return;
    }

    const [id] = keyVal;

    scrollIntoView(makeScrollIntoViewId(id), {
      behavior: "smooth",
    });
  }, [fieldErrors]);

  // we use getExperience( instead of getExperience so that getExperiences does
  // not get deleted
  useDeleteCachedQueriesAndMutationsOnUnmount(
    [
      "getExperience(",
      MUTATION_NAME_createEntry,
      MUTATION_NAME_createOfflineEntry,
    ],
    true,
  );

  function goToExperience() {
    (navigate as NavigateFn)(makeExperienceRoute(experience.id));
  }

  async function onSubmit() {
    const { dataDefinitions, id: experienceId } = experience;

    const dataObjects = dataObjectsFromFormValues(
      state.formObj,
      dataDefinitions as ExperienceFragment_dataDefinitions[],
    );

    try {
      let createResult: CreateEntryMutation_createEntry;

      if (isConnected()) {
        const result = await createEntry({
          variables: {
            input: {
              experienceId,
              dataObjects,
            },
          },

          update: updateExperienceWithNewEntry(experienceId),
        });

        createResult = ((result && result.data && result.data.createEntry) ||
          {}) as CreateEntryMutation_createEntry;
      } else {
        const result = await createOfflineEntry({
          variables: {
            experience,
            dataObjects,
          },
        });

        const { entry } = (result &&
          result.data &&
          result.data
            .createOfflineEntry) as CreateOfflineEntryMutationReturned["createOfflineEntry"];

        createResult = { entry } as CreateEntryMutation_createEntry;
      }

      const { entry, errors } = createResult;

      if (errors) {
        dispatch([ActionTypes.setCreateEntryErrors, errors]);
        return;
      }

      if (entry) {
        goToExperience();
      }
    } catch (errors) {
      const parsedErrors = parseApolloErrors(errors);

      dispatch([ActionTypes.setServerErrors, parsedErrors]);

      if (parsedErrors.networkError) {
        scrollIntoView("js-scroll-into-view-network-error");
      }
    }
  }

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
              dispatch([ActionTypes.removeServerErrors]);
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
                formValues={state.formObj}
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

export default NewEntry;

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
              dispatch([
                ActionTypes.setFormObjField,
                {
                  formFieldName,
                  value:
                    type === DataTypes.DECIMAL || type === DataTypes.INTEGER
                      ? Number(inputVal)
                      : inputVal,
                },
              ]);
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
    dispatch([
      ActionTypes.setFormObjField,
      { formFieldName: fieldName, value },
    ]);
  };
}

function dataObjectsFromFormValues(
  formObj: State["formObj"],
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

interface DataComponentProps {
  definition: ExperienceFragment_dataDefinitions;
  index: number;
  formValues: FormObj;
  dispatch: DispatchType;
  error?: string;
}

type E = React.ChangeEvent<HTMLInputElement>;
