import React, { useEffect, useReducer } from "react";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { NavigateFn } from "@reach/router";

import "./styles.scss";
import {
  Props,
  FormObj,
  FormObjVal,
  ToString,
  makePageTitle,
  formFieldNameFromIndex,
  reducer,
  DispatchType,
  ActionTypes,
  parseApolloErrors,
} from "./utils";
import { makeExperienceRoute } from "../../constants/experience-route";
import { CreateEntryMutationFn } from "../../graphql/create-entry.mutation";
import { updateExperienceWithNewEntry } from "./update";
import { fieldTypeUtils } from "./field-types-utils";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { getConnStatus } from "../../state/get-conn-status";
import { ExperienceFragment_fieldDefs } from "../../graphql/apollo-types/ExperienceFragment";
import makeClassNames from "classnames";
import { FormCtrlError } from "../FormCtrlError/component";
import { makeScrollIntoViewId, scrollIntoView } from "../scroll-into-view";

export function NewEntry(props: Props) {
  const {
    navigate,
    createEntry,
    createUnsavedEntry,
    client,
    experience,
  } = props;

  const [state, dispatch] = useReducer(reducer, {
    formObj: {},
    fieldErrors: {},
  });

  const { fieldErrors, networkError } = state;

  const pageTitle = makePageTitle(experience);

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(pageTitle));

      return setDocumentTitle;
    },
    [pageTitle],
  );

  useEffect(
    function setInitialFormValues() {
      if (experience) {
        dispatch([ActionTypes.experienceToFormValues, experience]);
      }
    },
    [experience],
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

  function goToExp() {
    (navigate as NavigateFn)(makeExperienceRoute(experience.id));
  }

  async function onSubmit() {
    const fields = [];
    const { fieldDefs, id: expId } = experience;

    for (const [stringIndex, val] of Object.entries(state.formObj)) {
      const index = Number(stringIndex);
      const field = fieldDefs[index] as ExperienceFragment_fieldDefs;

      const { type, id } = field;
      const toString = fieldTypeUtils[type].toString as ToString;

      fields.push({
        defId: id,
        //JSON.stringify({ [type.toLowerCase()]: toString(val) })
        data: `{"${type.toLowerCase()}":"${toString(val)}"}`,
      });
    }

    try {
      if (await getConnStatus(client)) {
        await (createEntry as CreateEntryMutationFn)({
          variables: {
            input: {
              expId,
              fields,
            },
          },

          update: updateExperienceWithNewEntry(expId),
        });
      } else {
        await createUnsavedEntry({
          variables: {
            experience,
            fields,
          },
        });
      }

      goToExp();
    } catch (errors) {
      const parsedErrors = parseApolloErrors(errors);

      dispatch([ActionTypes.setServerErrors, parsedErrors]);

      if (parsedErrors.networkError) {
        scrollIntoView("js-scroll-into-view-network-error");
      }
    }
  }

  function renderMain() {
    const { fieldDefs, title } = experience;

    return (
      <div className="main">
        <Button type="button" onClick={goToExp} className="title" basic={true}>
          {title}
        </Button>

        {networkError && (
          <Message
            style={{
              minHeight: "auto",
              position: "relative",
              marginTop: 0,
            }}
            data-testid="network-error"
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
          {fieldDefs.map((obj, index) => {
            const fieldDefinition = obj as ExperienceFragment_fieldDefs;

            return (
              <FieldComponent
                key={fieldDefinition.id}
                field={fieldDefinition}
                index={index}
                formValues={state.formObj}
                dispatch={dispatch}
                error={fieldErrors[fieldDefinition.id]}
              />
            );
          })}

          <Button
            className="submit-btn"
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
  field: ExperienceFragment_fieldDefs;
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
    const utils = fieldTypeUtils[type];
    const value = formValues[index] || (utils.default() as FormObjVal);

    return (
      <Form.Field
        key={id}
        className={makeClassNames({ error: !!error, "form-field": true })}
      >
        <span
          id={makeScrollIntoViewId(id)}
          data-testid="js-scroll-into-view"
          className="js-scroll-into-view"
        />

        <label htmlFor={formFieldName}>{`[${type}] ${fieldTitle}`}</label>

        {utils.component({
          formFieldName,
          dispatch,
          value,
        })}

        {error && (
          <FormCtrlError error={error} data-testid={`field-error-${id}`} />
        )}
      </Form.Field>
    );
  },

  function FieldComponentDiff(prevProps, nextProps) {
    const {
      field: { type: prevType },
      formValues: prevFormValues,
      error: currentError,
    } = prevProps;
    const {
      field: { type: nextType },
      formValues: nextFormValues,
      error: nextError,
    } = nextProps;

    const prevVal =
      prevFormValues[prevProps.index] || fieldTypeUtils[prevType].default;

    const nextVal =
      nextFormValues[nextProps.index] || fieldTypeUtils[nextType].default;

    return prevVal === nextVal && currentError === nextError;
  },
);
