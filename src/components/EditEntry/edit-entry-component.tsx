import React, { useReducer, useContext } from "react";
import {
  Props,
  ActionTypes,
  initStateFromProps,
  reducer,
  DefinitionState,
  DispatchType,
  DefinitionsStates,
  DataState,
  EditingMultipleDefinitionsState,
  EditEnryContext,
  State,
  DataStates,
  SubmissionResponseState,
} from "./edit-entry-utils";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import makeClassNames from "classnames";
import { UpdateDefinitions_updateDefinitions } from "../../graphql/apollo-types/UpdateDefinitions";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import { UpdateDefinitionsMutationFn } from "../../graphql/update-definition-and-data.mutation";
import {
  UpdateDefinitionInput,
  UpdateDataObjectInput,
} from "../../graphql/apollo-types/globalTypes";
import "./edit-entry.styles.scss";
import { SubmittingOverlay } from "../SubmittingOverlay/submitting-overlay";
import { componentFromDataType } from "../NewEntry/component-from-data-type";
import { FormObjVal } from "../Experience/experience.utils";
import { InputOnChangeData } from "semantic-ui-react";
import { FieldType } from "../../graphql/apollo-types/globalTypes";
import {
  UpdateDataObjectsOnlineMutationProps,
  UpdateDefinitionsMutationProps,
  UpdateDefinitionAndDataOnlineMutationProps,
} from "../../graphql/update-definition-and-data.mutation";
import { formObjToString } from "../NewEntry/new-entry.utils";
import { UpdateDataObjectsResponseFragment_fieldErrors } from "../../graphql/apollo-types/UpdateDataObjectsResponseFragment";

export function EditEntry(props: Props) {
  const {
    updateDefinitionsOnline,
    dispatch: parentDispatch,
    experience,
    editEntryUpdate,
    updateDataObjectsOnline,
    updateDefinitionAndDataOnline,
  } = props;

  const [state, dispatch] = useReducer(reducer, props, initStateFromProps);
  const {
    primaryState: {
      context: { definitionsIds, dataIds },
      common: commonState,
      editingData,
      editingMultipleDefinitions,
      submissionResponse,
    },
  } = state;

  window.state = state;

  //console.log(JSON.stringify(state, null, 2));

  return (
    <EditEnryContext.Provider
      value={{
        editEntryUpdate,
        dispatch,
        updateDataObjectsOnline,
        updateDefinitionAndDataOnline,
      }}
    >
      {commonState.value === "submitting" && <SubmittingOverlay />}

      <Modal
        id="edit-entry-modal"
        open={true}
        closeIcon={true}
        onClose={() => {
          if (commonState.value === "submitting") {
            return;
          }

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

        <SubmissionSuccessResponseComponent state={submissionResponse} />
        <SubmissionFormErrorsComponent state={submissionResponse} />

        <Modal.Content>
          <Form>
            {definitionsIds.map(id => {
              const definitionState = state.definitionsStates[id];

              return (
                <DefinitionComponent
                  dispatch={dispatch}
                  key={id}
                  id={id}
                  state={definitionState}
                  onSubmit={submitDefinitions({
                    dispatch,
                    updateDefinitionsOnline,
                    allDefinitionsStates: state.definitionsStates,
                    editEntryUpdate,
                  })}
                  shouldSubmit={getIdOfSubmittingDefinition(
                    id,
                    editingData,
                    editingMultipleDefinitions,
                  )}
                />
              );
            })}

            {dataIds.map(id => {
              const dataState = state.dataStates[id];

              return <DataComponent key={id} state={dataState} id={id} />;
            })}

            {editingData && (
              <Button
                positive={true}
                compact={true}
                type="submit"
                id="edit-entry-submit"
                className="edit-entry-definition-submit"
                onClick={submitAll({
                  dispatch,
                  globalState: state,
                  updateDataObjectsOnline,
                  updateDefinitionAndDataOnline,
                  updateDefinitionsOnline,
                  editEntryUpdate,
                })}
              >
                Submit
              </Button>
            )}
          </Form>
        </Modal.Content>
      </Modal>
    </EditEnryContext.Provider>
  );
}

function SubmissionSuccessResponseComponent({
  state,
}: {
  state?: SubmissionResponseState;
}) {
  const { dispatch } = useContext(EditEnryContext);

  if (state && state.isActive && state.value === "submissionSuccess") {
    const {
      submissionSuccess: {
        context: { validResponse, invalidResponse },
      },
    } = state;

    return (
      <Modal.Content id="edit-entry-submission-response-message">
        <Message
          onDismiss={() => {
            dispatch({
              type: ActionTypes.DISMISS_SUBMISSION_RESPONSE_MESSAGE,
            });
          }}
        >
          {validResponse && (
            <div>
              {validResponse.successes}
              {validResponse.failures}
            </div>
          )}

          {invalidResponse && (
            <div> {invalidResponse.data || invalidResponse.definitions} </div>
          )}
        </Message>
      </Modal.Content>
    );
  }

  return null;
}

function DataComponent(props: DataComponentProps) {
  const { id, state } = props;

  const { dispatch } = useContext(EditEnryContext);

  const formValue =
    state.value === "changed"
      ? state.changed.context.formValue
      : state.context.defaults.parsedVal;

  const idPrefix = `edit-entry-data-${id}`;

  const component = getDataComponent(
    state.context.defaults.type,
    id,
    dispatch,
    idPrefix,
    formValue,
  );

  const errors = getDataFormErrors(state);

  return (
    <Form.Field
      id={idPrefix}
      className={makeClassNames({
        "data--success":
          state.value === "unchanged" && state.unchanged.context.anyEditSuccess,
      })}
      error={!!errors}
    >
      {component}

      {!!errors && (
        <FormCtrlError id={`${idPrefix}-error`}>{errors}</FormCtrlError>
      )}
    </Form.Field>
  );
}

function getDataComponent(
  type: FieldType,
  id: string,
  dispatch: DispatchType,
  fieldName: string,
  fieldValue: FormObjVal,
) {
  const onChange =
    type === FieldType.DATE || type === FieldType.DATETIME
      ? (_: string, val: FormObjVal) => {
          dispatch({
            type: ActionTypes.DATA_CHANGED,
            id,
            rawFormVal: val,
          });
        }
      : (_: E, { value: rawFormVal }: InputOnChangeData) => {
          dispatch({
            type: ActionTypes.DATA_CHANGED,
            id,
            rawFormVal,
          });
        };

  const name = `${fieldName}-input`;

  const props = {
    id: name,
    value: fieldValue,
    name,
    onChange,
  };

  return componentFromDataType(type, props);
}

function DefinitionComponent(props: DefinitionComponentProps) {
  const { id, state, onSubmit, dispatch, shouldSubmit } = props;
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

                {shouldSubmit && (
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

function SubmissionFormErrorsComponent({
  state,
}: {
  state?: SubmissionResponseState;
}) {
  const { dispatch } = useContext(EditEnryContext);

  if (state && state.isActive && state.value === "formErrors") {
    const {
      formErrors: {
        context: { errors },
      },
    } = state;

    return (
      <Modal.Content id="edit-entry-form-errors-message">
        <Message
          onDismiss={() => {
            dispatch({
              type: ActionTypes.DISMISS_SUBMISSION_RESPONSE_MESSAGE,
            });
          }}
        >
          {errors}
        </Message>
      </Modal.Content>
    );
  }

  return null;
}

function submitDefinitions(props: SubmitDefinitionsArgs) {
  return async function submitDefinitionInner() {
    const {
      dispatch,
      updateDefinitionsOnline,
      allDefinitionsStates,
      editEntryUpdate,
    } = props;

    dispatch({
      type: ActionTypes.SUBMITTING,
    });

    const [input, withErrors] = getDefinitionsToSubmit(
      allDefinitionsStates,
    ) as [UpdateDefinitionInput[], string[]];

    if (withErrors.length > 0) {
      dispatch({
        type: ActionTypes.DEFINITION_FORM_ERRORS,
        ids: withErrors,
      });

      return;
    }

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
      type: ActionTypes.DEFINITIONS_SUBMISSION_RESPONSE,
      ...data,
    });
  };
}

function getDefinitionsToSubmit(allDefinitionsStates: DefinitionsStates) {
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

  return [input, withErrors];
}

function submitAll(args: SubmitAllArgs) {
  return async function submitAllInner() {
    const {
      dispatch,
      globalState,
      updateDefinitionAndDataOnline,
      editEntryUpdate,
    } = args;

    dispatch({
      type: ActionTypes.SUBMITTING,
    });

    const [
      definitionsInput,
      definitionsWithFormErrors,
    ] = getDefinitionsToSubmit(globalState.definitionsStates) as [
      UpdateDefinitionInput[],
      string[],
    ];

    if (definitionsWithFormErrors.length !== 0) {
      dispatch({
        type: ActionTypes.DEFINITION_FORM_ERRORS,
        ids: definitionsWithFormErrors,
      });

      return;
    }

    const [dataInput] = getDataObjectsToSubmit(globalState.dataStates);

    const result = await updateDefinitionAndDataOnline({
      variables: {
        definitionsInput,
        dataInput,
      },

      update: editEntryUpdate,
    });

    const successResult = result && result.data;

    if (successResult) {
      dispatch({
        type: ActionTypes.SUBMISSION_RESPONSE,
        ...successResult,
      });
    }
  };
}

function getDataObjectsToSubmit(states: DataStates) {
  const inputs: UpdateDataObjectInput[] = [];

  for (const [id, state] of Object.entries(states)) {
    if (state.value === "changed") {
      const {
        context: {
          defaults: { type },
        },
        changed: {
          context: { formValue },
        },
      } = state;
      inputs.push({
        id,
        data: `{"${type.toLowerCase()}":"${formObjToString(type, formValue)}"}`,
      });
    }
  }

  return [inputs];
}

function getIdOfSubmittingDefinition(
  id: string,
  editingData?: boolean,
  editingMultipleDefinitionsState?: EditingMultipleDefinitionsState,
) {
  if (editingData) {
    return false;
  }

  if (!editingMultipleDefinitionsState) {
    return true;
  }

  const {
    context: { firstChangedDefinitionId },
  } = editingMultipleDefinitionsState;

  return id === firstChangedDefinitionId;
}

function getDefinitionFormError(state: DefinitionState) {
  if (state.value === "editing" && state.editing.value === "changed") {
    const { changed } = state.editing;

    if (changed.value === "formErrors" || changed.value === "serverErrors") {
      const {
        context: { errors },
      } = changed;

      return getNodesFromObject(errors as { [k: string]: string });
    }
  }

  return null;
}

function getDataFormErrors(state: DataState) {
  if (state.value === "changed") {
    const { changed } = state;

    let errors = {} as UpdateDataObjectsResponseFragment_fieldErrors;

    if (changed.value === "serverErrors") {
      errors = changed.serverErrors.context.errors;

      return getNodesFromObject((errors as unknown) as { [k: string]: string });
    }
  }

  return null;
}

function getNodesFromObject(obj: { [k: string]: string }) {
  return Object.entries(obj).reduce(
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

interface SubmitDefinitionsArgs {
  dispatch: DispatchType;
  updateDefinitionsOnline: UpdateDefinitionsMutationFn;
  allDefinitionsStates: DefinitionsStates;
  editEntryUpdate: () => void;
}

interface DefinitionComponentProps {
  state: DefinitionState;
  id: string;
  onSubmit: () => void;
  dispatch: DispatchType;
  shouldSubmit: boolean;
}

interface DataComponentProps {
  id: string;
  state: DataState;
}

type E = React.ChangeEvent<HTMLInputElement>;

interface SubmitAllArgs
  extends UpdateDefinitionAndDataOnlineMutationProps,
    UpdateDataObjectsOnlineMutationProps,
    UpdateDefinitionsMutationProps {
  dispatch: DispatchType;
  globalState: State;
  editEntryUpdate: () => void;
}
