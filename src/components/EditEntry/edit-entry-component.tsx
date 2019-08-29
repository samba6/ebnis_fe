import React, { useReducer, useContext } from "react";
import {
  Props,
  ActionTypes,
  initStateFromProps,
  reducer,
  DefinitionState,
  DefinitionsContextProvider,
  DefinitionsContext,
  DispatchType,
  DefinitionChangedState,
  DefinitionsStates,
} from "./edit-entry-utils";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import makeClassNames from "classnames";
import { UpdateDefinitions_updateDefinitions } from "../../graphql/apollo-types/UpdateDefinitions";
import { editEntryUpdate } from "./edit-entry.update";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import { UpdateDefinitionsMutationFn } from "../../graphql/update-definitions.mutation";
import { UpdateDefinitionInput } from "../../graphql/apollo-types/globalTypes";

export function EditEntry(props: Props) {
  const { updateDefinitionsOnline, dispatch: parentDispatch } = props;

  const [state, dispatch] = useReducer(reducer, props, initStateFromProps);
  const { definitionsDefaultsMap, definitionsIds } = state;

  return (
    <Modal
      id="edit-entry-modal"
      open={true}
      closeIcon={true}
      onClose={() => {
        parentDispatch({
          type: ActionTypes.DESTROYED,
        });
      }}
      dimmer="inverted"
      closeOnDimmerClick={false}
    >
      <Modal.Header>Edit Entry</Modal.Header>
      {state.value === "submitting" && (
        <span id="edit-entry-submitting">Submitting</span>
      )}

      <Form>
        <DefinitionsContextProvider
          value={{
            dispatch,
            definitionsDefaultsMap,
            updateDefinitionsOnline,
          }}
        >
          {definitionsIds.map(id => {
            return (
              <DefinitionComponent
                key={id}
                id={id}
                stateContext={state.definitionsStates[id]}
                allDefinitionsStates={state.definitionsStates}
              />
            );
          })}
        </DefinitionsContextProvider>
      </Form>
    </Modal>
  );
}

interface DefinitionComponentProps {
  stateContext: DefinitionState;
  id: string;
  allDefinitionsStates: DefinitionsStates;
}

function DefinitionComponent(props: DefinitionComponentProps) {
  const { id, stateContext } = props;
  const { state } = stateContext;

  const {
    dispatch,
    definitionsDefaultsMap,
    updateDefinitionsOnline,
  } = useContext(DefinitionsContext);

  const idPrefix = `edit-entry-definition-${id}`;

  const {
    definition: { type, name: defaultFormValue },
  } = definitionsDefaultsMap[id];
  const typeText = `[${type}]`;

  const error = getDefinitionFormError(state);

  return (
    <Form.Field
      id={idPrefix}
      className={makeClassNames({
        success: !!(
          state.value === "idle" &&
          state.idle &&
          state.idle.value === "anyEditSuccessful"
        ),
      })}
      error={!!error}
    >
      {state.value === "idle" && (
        <div>
          <span>{typeText}</span>

          <span id={`${idPrefix}-name`}>{defaultFormValue}</span>

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
        </div>
      )}

      {state.value === "editing" && (
        <>
          <div>
            <label htmlFor={`${idPrefix}-input`}>{typeText}</label>

            <Input
              id={`${idPrefix}-input`}
              name={`${idPrefix}-input`}
              defaultValue={defaultFormValue}
              onChange={(_, { value }) => {
                dispatch({
                  type: ActionTypes.DEFINITION_NAME_CHANGED,
                  id,
                  formValue: value,
                });
              }}
            />
          </div>

          <Button
            type="button"
            id={`${idPrefix}-dismiss`}
            onClick={() => {
              dispatch({
                type: ActionTypes.STOP_DEFINITION_EDIT,
                id,
              });
            }}
          >
            Dismiss
          </Button>

          {state.editing.value === "changed" && (
            <>
              <Button
                type="button"
                id={`${idPrefix}-reset`}
                onClick={() => {
                  dispatch({
                    type: ActionTypes.UNDO_DEFINITION_EDITS,
                    id,
                  });
                }}
              >
                Reset
              </Button>

              {shouldShowDefinitionSubmitBtn(state.editing.changed) && (
                <Button
                  type="submit"
                  id={`${idPrefix}-submit`}
                  onClick={submitDefinitions({
                    dispatch,
                    updateDefinitionsOnline,
                    allDefinitionsStates: props.allDefinitionsStates,
                  })}
                >
                  Submit
                </Button>
              )}

              {!!error && (
                <FormCtrlError id={`${idPrefix}-error`}>{error}</FormCtrlError>
              )}
            </>
          )}
        </>
      )}
    </Form.Field>
  );
}

interface SubmitDefinitionsArgs {
  dispatch: DispatchType;
  updateDefinitionsOnline: UpdateDefinitionsMutationFn;
  allDefinitionsStates: DefinitionsStates;
}

function submitDefinitions(props: SubmitDefinitionsArgs) {
  return async function submitDefinitionInner() {
    const { dispatch, updateDefinitionsOnline, allDefinitionsStates } = props;

    const input: UpdateDefinitionInput[] = [];
    const withErrors: string[] = [];

    for (const [id, stateData] of Object.entries(allDefinitionsStates)) {
      const { state, formValue } = stateData;
      if (state.value === "editing" && state.editing.value === "changed") {
        const name = formValue.trim();

        if (name.length < 2) {
          withErrors.push(id);
        } else {
          input.push({
            id,
            name,
          });
        }
      }
    }

    if (withErrors.length > 0) {
      dispatch({
        type: ActionTypes.DEFINITION_FORM_ERRORS,
        ids: withErrors,
      });

      return;
    }

    dispatch({
      type: ActionTypes.TITLE_EDIT_SUBMIT,
    });

    const result = await updateDefinitionsOnline({
      variables: {
        input,
      },
      update: editEntryUpdate,
    });

    const data = (result &&
      result.data &&
      result.data.updateDefinitions) as UpdateDefinitions_updateDefinitions;

    dispatch({
      type: ActionTypes.SUBMISSION_RESULT,
      ...data,
    });
  };
}

function shouldShowDefinitionSubmitBtn(
  state: DefinitionChangedState["changed"],
) {
  const { notEditingData } = state;

  // istanbul ignore next: TODO: add when I edit data
  if (!notEditingData) {
    return false;
  }

  if (notEditingData.value === "notEditingSiblings") {
    return true;
  }

  if (
    notEditingData.value === "editingSiblings" &&
    notEditingData.editingSiblings.firstEditableSibling
  ) {
    return true;
  }

  return false;
}

function getDefinitionFormError(state: DefinitionState["state"]) {
  if (state.value === "editing" && state.editing.value === "changed") {
    const { form } = state.editing.changed;

    if (form.value === "formErrors" || form.value === "serverErrors") {
      const {
        context: { errors },
      } = form;

      return Object.entries(errors).reduce(
        (acc, [k, v]) => {
          if (k !== "__typename" && v) {
            acc.push(
              <span key={k}>
                {k}: {v}
              </span>,
            );
          }

          return acc;
        },
        [] as JSX.Element[],
      );
    }
  }

  return null;
}
