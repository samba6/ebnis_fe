import React, { useMemo, useReducer, useContext } from "react";
import {
  Props,
  FormValues,
  DefinitionFormValue,
  ActionTypes,
  initialStateFromProps,
  reducer,
  State,
  DefinitionState,
  DefaultDefinitionsMap,
  DefinitionsContextProvider,
  definitionsContext,
} from "./utils";
import { Formik, FormikProps, FieldArray, Field } from "formik";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import { noop } from "../../constants";

export function EditEntry(props: Props) {
  const { definitions } = props;

  const [state, dispatch] = useReducer(reducer, props, initialStateFromProps);

  const [initialDefinitionsValues, defaultDefinitionsMap] = useMemo(() => {
    return definitions.reduce(
      ([formValues, map], definition) => {
        const formValue = {
          name: definition.name,
          id: definition.id,
        };

        formValues.push(formValue);
        map[definition.id] = definition;

        return [formValues, map];
      },
      [[], {}] as [DefinitionFormValue[], DefaultDefinitionsMap],
    );
  }, []);

  function renderForm(formProps: FormikProps<FormValues>) {
    return (
      <Form>
        <DefinitionsContextProvider
          value={{
            dispatch,
            defaultDefinitionsMap,
          }}
        >
          <DefinitionsComponent
            state={state.definitionsStates}
            formValues={formProps.values.definitions}
          />
        </DefinitionsContextProvider>
      </Form>
    );
  }
  return (
    <Formik
      render={renderForm}
      initialValues={{
        definitions: initialDefinitionsValues,
      }}
      onSubmit={noop}
    />
  );
}

interface DefinitionsComponentProps {
  formValues: FormValues["definitions"];
  state: State["definitionsStates"];
}

function DefinitionsComponent(props: DefinitionsComponentProps) {
  const { formValues, state } = props;

  return (
    <FieldArray
      name="definitions"
      render={() => {
        return formValues.map(definition => {
          return (
            <Field
              key={definition.id}
              render={() => {
                return (
                  <DefinitionComponent
                    formValue={definition}
                    stateContext={state[definition.id]}
                  />
                );
              }}
            />
          );
        });
      }}
    />
  );
}

interface DefinitionComponentProps {
  stateContext: DefinitionState;
  formValue: DefinitionFormValue;
}

function DefinitionComponent(props: DefinitionComponentProps) {
  const { formValue, stateContext } = props;
  const { state } = stateContext;
  const { dispatch, defaultDefinitionsMap } = useContext(definitionsContext);

  const { id, name: formNameValue } = formValue;
  const idPrefix = `edit-entry-definition-${id}`;
  const { type } = defaultDefinitionsMap[id];

  return (
    <div id={idPrefix}>
      <Form.Field>
        {type}

        {state === "idle" && (
          <span id={`${idPrefix}-name`}>{formNameValue}</span>
        )}

        {state === "pristine" && (
          <Input id={`${idPrefix}-input`} value={formNameValue} />
        )}

        {state === "idle" && (
          <Button
            type="button"
            id={`${idPrefix}-edit-btn`}
            onClick={() =>
              dispatch({
                type: ActionTypes.EDIT_BTN_CLICKED,
                id,
              })
            }
          >
            Edit
          </Button>
        )}

        {state === "pristine" && (
          <Button type="button" id={`${idPrefix}-dismiss`}>
            Submit
          </Button>
        )}
      </Form.Field>
    </div>
  );
}
