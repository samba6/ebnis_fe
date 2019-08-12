import React, { useMemo, useReducer } from "react";
import {
  Props,
  FormValues,
  DefinitionFormValue,
  ActionTypes,
  DispatchType,
  initialStateFromProps,
  reducer,
  State,
  DefinitionState,
} from "./utils";
import { Formik, FormikProps, FieldArray, Field } from "formik";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { noop } from "../../constants";

export const x = 1 + 1;

export function EditEntry(props: Props) {
  const { definitions } = props;

  const [state, dispatch] = useReducer(reducer, props, initialStateFromProps);

  const initialDefinitionsValues = useMemo(() => {
    return definitions.map(definition => {
      return {
        name: definition.name,
        type: definition.type,
        id: definition.id,
      };
    });
  }, []);

  function renderForm(formProps: FormikProps<FormValues>) {
    return (
      <Form>
        <DefinitionsComponent
          state={state.definitionsStates}
          dispatch={dispatch}
          formProps={formProps}
        />
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
  formProps: FormikProps<FormValues>;
  dispatch: DispatchType;
  state: State["definitionsStates"];
}

function DefinitionsComponent(props: DefinitionsComponentProps) {
  const {
    formProps: {
      values: { definitions },
    },
    dispatch,
    state,
  } = props;

  return (
    <FieldArray
      name="definitions"
      render={() => {
        return definitions.map(definition => {
          return (
            <Field
              key={definition.id}
              render={() => {
                return (
                  <DefinitionComponent
                    dispatch={dispatch}
                    definition={definition}
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
  definition: DefinitionFormValue;
  dispatch: DispatchType;
  stateContext: DefinitionState;
}

function DefinitionComponent(props: DefinitionComponentProps) {
  const { definition, dispatch, stateContext } = props;

  const { id } = definition;
  const idPrefix = `edit-entry-definition-${id}`;

  return (
    <div id={idPrefix}>
      <Form.Field id={`${idPrefix}-name`}>
        {definition.name}
        {definition.type}

        {stateContext.state === "idle" && (
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

        {stateContext.state === "pristine" && (
          <Button type="button" id={`${idPrefix}-dismiss`}>
            Submit
          </Button>
        )}
      </Form.Field>
    </div>
  );
}
