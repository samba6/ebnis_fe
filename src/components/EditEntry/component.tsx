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
  DefinitionsContext,
} from "./utils";
import { Formik, FormikProps, FieldArray, Field, FieldProps } from "formik";
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
        return formValues.map((definition, index) => {
          return (
            <DefinitionComponent
              key={definition.id}
              id={definition.id}
              stateContext={state[definition.id]}
              index={index}
            />
          );
        });
      }}
    />
  );
}

interface DefinitionComponentProps {
  stateContext: DefinitionState;
  id: string;
  index: number;
}

function DefinitionComponent(props: DefinitionComponentProps) {
  const { id, stateContext, index } = props;
  const { state } = stateContext;
  const { dispatch, defaultDefinitionsMap } = useContext(DefinitionsContext);

  const idPrefix = `edit-entry-definition-${id}`;
  const { type, name: defaultFormValue } = defaultDefinitionsMap[id];
  const fieldName = `definitions[${index}].name`;

  return (
    <div id={idPrefix}>
      <Form.Field>
        {type}

        <Field name={fieldName}>
          {({
            field: { value, ...rest },
            form: { setFieldValue },
          }: FieldProps<FormValues>) => {
            return (
              <>
                {state === "idle" && (
                  <span id={`${idPrefix}-name`}>{value}</span>
                )}

                {(state === "pristine" || state === "dirty") && (
                  <Input
                    {...rest}
                    id={`${idPrefix}-input`}
                    value={value}
                    onChange={(_, data) => {
                      setFieldValue(fieldName, data.value);

                      dispatch({
                        type:
                          data.value !== defaultFormValue
                            ? ActionTypes.TITLE_CHANGED
                            : ActionTypes.TITLE_RESET,
                        id,
                      });
                    }}
                  />
                )}
              </>
            );
          }}
        </Field>

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
          <Button
            type="button"
            id={`${idPrefix}-dismiss`}
            onClick={() => {
              dispatch({
                type: ActionTypes.TITLE_EDIT_DISMISS,
                id,
              });
            }}
          >
            Dismiss
          </Button>
        )}

        {state === "dirty" && (
          <Button
            type="submit"
            id={`${idPrefix}-submit`}
            onClick={() => {
              dispatch({
                type: ActionTypes.TITLE_EDIT_DISMISS,
                id,
              });
            }}
          >
            Submit
          </Button>
        )}
      </Form.Field>
    </div>
  );
}
