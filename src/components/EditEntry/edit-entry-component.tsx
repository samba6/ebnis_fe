import React, { useReducer, useContext } from "react";
import {
  Props,
  ActionTypes,
  initStateFromProps,
  reducer,
  DefinitionState,
  DefinitionsContextProvider,
  DefinitionsContext,
} from "./edit-entry-utils";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import makeClassNames from "classnames";
import { UpdateDefinitions_updateDefinitions } from "../../graphql/apollo-types/UpdateDefinitions";
import { editEntryUpdate } from "./edit-entry.update";

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
      {state.state === "submitting" && (
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
}

function DefinitionComponent(props: DefinitionComponentProps) {
  const { id, stateContext } = props;
  const { state, formValue } = stateContext;

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

  return (
    <Form.Field
      id={idPrefix}
      className={makeClassNames({
        success: !!(
          state.value === "idle" &&
          state.states &&
          state.states.value === "anyEditSuccessful"
        ),
      })}
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

          {state.states.value === "changed" && (
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
          )}

          <Button
            type="submit"
            id={`${idPrefix}-submit`}
            onClick={async () => {
              dispatch({
                type: ActionTypes.TITLE_EDIT_SUBMIT,
              });

              const result = await updateDefinitionsOnline({
                variables: {
                  input: [
                    {
                      id,
                      name: formValue.trim(),
                    },
                  ],
                },
                update: editEntryUpdate,
              });

              const data = (result &&
                result.data &&
                result.data
                  .updateDefinitions) as UpdateDefinitions_updateDefinitions;

              dispatch({
                type: ActionTypes.SUBMISSION_RESULT,
                ...data,
              });
            }}
          >
            Submit
          </Button>
        </>
      )}
    </Form.Field>
  );
}
