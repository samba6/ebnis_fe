import React, { useEffect, useReducer } from "react";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import TextArea from "semantic-ui-react/dist/commonjs/addons/TextArea";
import { NavigateFn } from "@reach/router";

import "./styles.scss";
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
} from "./utils";
import { makeExperienceRoute } from "../../constants/experience-route";
import { CreateEntryMutationFn } from "../../graphql/create-entry.mutation";
import { updateExperienceWithNewEntry } from "./update";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { isConnected } from "../../state/connections";
import { ExperienceFragment_dataDefinitions } from "../../graphql/apollo-types/ExperienceFragment";
import makeClassNames from "classnames";
import { FormCtrlError } from "../FormCtrlError/component";
import { makeScrollIntoViewId, scrollIntoView } from "../scroll-into-view";
import { FieldType } from "../../graphql/apollo-types/globalTypes";
import { DateField } from "../DateField/component";
import { DateTimeField } from "../DateTimeField/component";
import dateFnFormat from "date-fns/format";
import { CreateEntryMutation_createEntry } from "../../graphql/apollo-types/CreateEntryMutation";
import { CreateUnsavedEntryMutationReturned } from "./resolvers";

export function NewEntry(props: Props) {
  const { navigate, createEntry, createUnsavedEntry, experience } = props;

  const [state, dispatch] = useReducer(
    reducer,
    experience,
    initialStateFromProps,
  );

  const { fieldErrors, networkError } = state;

  const pageTitle = makePageTitle(experience);

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

  function goToExperience() {
    (navigate as NavigateFn)(makeExperienceRoute(experience.id));
  }

  async function onSubmit() {
    const dataObjects = [];
    const { dataDefinitions, id: experienceId } = experience;

    for (const [stringIndex, val] of Object.entries(state.formObj)) {
      const index = Number(stringIndex);
      const definition = dataDefinitions[
        index
      ] as ExperienceFragment_dataDefinitions;

      const { type, id: definitionId } = definition;

      let toString;

      switch (type) {
        case FieldType.DATE:
          {
            toString = dateFnFormat(val, "YYYY-MM-DD");
          }

          break;

        case FieldType.DATETIME:
          {
            toString = (val as Date).toJSON();
          }

          break;

        case FieldType.DECIMAL:
        case FieldType.INTEGER:
          {
            toString = (val || 0) + "";
          }

          break;

        case FieldType.SINGLE_LINE_TEXT:
        case FieldType.MULTI_LINE_TEXT:
          {
            toString = val;
          }

          break;
      }

      dataObjects.push({
        definitionId,

        data: `{"${type.toLowerCase()}":"${toString}"}`,
      });
    }

    try {
      let createResult: CreateEntryMutation_createEntry;

      if (isConnected()) {
        const result = await (createEntry as CreateEntryMutationFn)({
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
        const result = await createUnsavedEntry({
          variables: {
            experience,
            dataObjects: dataObjects,
          },
        });

        const { entry } = (result &&
          result.data &&
          result.data
            .createUnsavedEntry) as CreateUnsavedEntryMutationReturned["createUnsavedEntry"];

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
            const fieldDefinition = obj as ExperienceFragment_dataDefinitions;

            return (
              <FieldComponent
                key={fieldDefinition.id}
                field={fieldDefinition}
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

interface FieldComponentProps {
  field: ExperienceFragment_dataDefinitions;
  index: number;
  formValues: FormObj;
  dispatch: DispatchType;
  error?: string;
}

const FieldComponent = React.memo(
  function FieldComponentFn(props: FieldComponentProps) {
    const { field, index, dispatch, formValues, error } = props;

    const { name: fieldTitle, type, id } = field;
    const formFieldName = formFieldNameFromIndex(index);
    const value = formValues[index] as FormObjVal;

    let component = null as React.ReactNode;
    let inputId = `new-entry-${type}-input`;

    switch (type) {
      case FieldType.DECIMAL:
      case FieldType.INTEGER:
        {
          component = (
            <Input
              type="number"
              id={inputId}
              name={formFieldName}
              value={value}
              fluid={true}
              onChange={(e, { value: inputVal }) => {
                dispatch([
                  ActionTypes.setFormObjField,
                  { formFieldName, value: Number(inputVal) },
                ]);
              }}
            />
          );
        }

        break;

      case FieldType.SINGLE_LINE_TEXT:
        {
          component = (
            <Input
              id={inputId}
              name={formFieldName}
              value={value}
              fluid={true}
              onChange={(e, { value: inputVal }) => {
                dispatch([
                  ActionTypes.setFormObjField,
                  { formFieldName, value: inputVal },
                ]);
              }}
            />
          );
        }

        break;

      case FieldType.MULTI_LINE_TEXT:
        {
          component = (
            <TextArea
              id={inputId}
              name={formFieldName}
              value={value as string}
              onChange={(e, { value: inputVal }) => {
                dispatch([
                  ActionTypes.setFormObjField,
                  { formFieldName, value: inputVal as string },
                ]);
              }}
            />
          );
        }

        break;

      case FieldType.DATE:
        {
          component = (
            <DateField
              value={value as Date}
              name={formFieldName}
              setValue={makeSetValueFunc(dispatch)}
              {...props}
            />
          );
        }

        break;

      case FieldType.DATETIME:
        {
          component = (
            <DateTimeField
              value={value as Date}
              name={formFieldName}
              setValue={makeSetValueFunc(dispatch)}
              {...props}
            />
          );
        }

        break;
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

function makeSetValueFunc(dispatch: DispatchType) {
  return function SetValue(fieldName: string, value: FormObjVal) {
    dispatch([
      ActionTypes.setFormObjField,
      { formFieldName: fieldName, value },
    ]);
  };
}
