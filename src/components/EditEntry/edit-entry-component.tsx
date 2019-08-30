import React, { useReducer } from "react";
import {
  Props,
  ActionTypes,
  initStateFromProps,
  reducer,
  DefinitionState,
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
import "./edit-entry.styles.scss";
import { SubmittingOverlay } from "../SubmittingOverlay/submitting-overlay";

export function EditEntry(props: Props) {
  const {
    updateDefinitionsOnline,
    dispatch: parentDispatch,
    experience,
  } = props;

  const [state, dispatch] = useReducer(reducer, props, initStateFromProps);
  const { definitionsIds } = state;

  return (
    <>
      {state.value === "submitting" && <SubmittingOverlay />}

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
        className="components-edit-entry"
      >
        <Modal.Header>
          <div> Edit Entry </div>

          <div className="experience-title" id="edit-entry-experience-title">
            {experience.title}
          </div>
        </Modal.Header>

        <Modal.Content>
          <Form>
            {definitionsIds.map(id => {
              return (
                <DefinitionComponent
                  dispatch={dispatch}
                  key={id}
                  id={id}
                  state={state.definitionsStates[id]}
                  onSubmit={submitDefinitions({
                    dispatch,
                    updateDefinitionsOnline,
                    allDefinitionsStates: state.definitionsStates,
                  })}
                />
              );
            })}
          </Form>
        </Modal.Content>
      </Modal>
    </>
  );
}

interface DefinitionComponentProps {
  state: DefinitionState;
  id: string;
  onSubmit: () => void;
  dispatch: DispatchType;
}

function DefinitionComponent(props: DefinitionComponentProps) {
  const { id, state, onSubmit, dispatch } = props;
  const idPrefix = `edit-entry-definition-${id}`;

  const { type, name: defaultFormValue } = state.context.defaults;
  const typeText = `[${type}]`;

  const error = getDefinitionFormError(state);

  return (
    <Form.Field
      id={idPrefix}
      className={makeClassNames({
        "definition--success": !!(
          state.value === "idle" && state.idle.context.anyEditSuccess
        ),
      })}
      error={!!error}
    >
      {state.value === "idle" && (
        <>
          <label>{typeText}</label>

          <Input
            id={`${idPrefix}-name`}
            value={defaultFormValue}
            disabled={true}
            className="idle-definition-name"
          />

          <Button
            primary={true}
            compact={true}
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
        </>
      )}

      {state.value === "editing" && (
        <>
          <label htmlFor={`${idPrefix}-input`}>{typeText}</label>

          <Input
            id={`${idPrefix}-input`}
            name={`${idPrefix}-input`}
            value={state.editing.context.formValue}
            onChange={(_, { value }) => {
              dispatch({
                type: ActionTypes.DEFINITION_NAME_CHANGED,
                id,
                formValue: value,
              });
            }}
            autoComplete="off"
            className="definition-input"
          >
            <input
              className={makeClassNames({
                "definition-input-unchanged":
                  state.editing.value === "unchanged",
              })}
            />
          </Input>

          <Button.Group>
            <Button
              primary={true}
              compact={true}
              type="button"
              id={`${idPrefix}-dismiss`}
              onClick={() => {
                dispatch({
                  type: ActionTypes.STOP_DEFINITION_EDIT,
                  id,
                });
              }}
              className="definition-dismiss"
            >
              Dismiss
            </Button>

            {state.editing.value === "changed" && (
              <>
                <Button
                  negative={true}
                  compact={true}
                  type="button"
                  id={`${idPrefix}-reset`}
                  onClick={() => {
                    dispatch({
                      type: ActionTypes.UNDO_DEFINITION_EDITS,
                      id,
                    });
                  }}
                  className="definition-reset"
                >
                  Reset
                </Button>

                {shouldShowDefinitionSubmitBtn(state.editing.changed) && (
                  <Button
                    positive={true}
                    compact={true}
                    type="submit"
                    id={`${idPrefix}-submit`}
                    onClick={onSubmit}
                    className="edit-entry-definition-submit"
                  >
                    Submit
                  </Button>
                )}
              </>
            )}
          </Button.Group>

          {!!error && (
            <FormCtrlError id={`${idPrefix}-error`}>{error}</FormCtrlError>
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

    for (const [id, state] of Object.entries(allDefinitionsStates)) {
      if (state.value === "editing" && state.editing.value === "changed") {
        const name = state.editing.context.formValue.trim();

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
      type: ActionTypes.DEFINITION_SUBMITTED,
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

function getDefinitionFormError(state: DefinitionState) {
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
