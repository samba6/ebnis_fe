import React, { useReducer, useContext, Fragment } from "react";
import {
  Props,
  ActionTypes,
  initStateFromProps,
  reducer,
  DefinitionState,
  DispatchType,
  DefinitionsStates,
  DataState,
  EditEnryContext,
  IStateMachine,
  DataStates,
  SubmissionResponseState,
  PrimaryState,
  OwnProps,
} from "./edit-entry-utils";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import makeClassNames from "classnames";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import {
  UpdateDefinitionInput,
  UpdateDataObjectInput,
} from "../../graphql/apollo-types/globalTypes";
import "./edit-entry.styles.scss";
import { SubmittingOverlay } from "../SubmittingOverlay/submitting-overlay";
import { componentFromDataType } from "../NewEntry/component-from-data-type";
import { FormObjVal } from "../Experience/experience.utils";
import { InputOnChangeData } from "semantic-ui-react";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";
import { formObjToString } from "../NewEntry/new-entry.utils";
import { UpdateDataObjectsResponseFragment_fieldErrors } from "../../graphql/apollo-types/UpdateDataObjectsResponseFragment";
import { ErrorBoundary } from "../ErrorBoundary/error-boundary.component";
import { ApolloError } from "apollo-client";
import {
  editEntryUpdate,
  useUpdateDataObjectsOnlineMutation,
  useUpdateDefinitionsOnline,
  useUpdateDefinitionAndDataOnline,
  EditEntryUpdateProps,
  UpdateDefinitionsAndDataOnlineProps,
  UpdateDataObjectsOnlineMutationProps,
  UpdateDefinitionsOnlineProps,
  UpdateDefinitionsOnlineMutationFn,
} from "./edit-entry.injectables";

export function EditEntryComponent(props: Props) {
  const {
    dispatch: parentDispatch,
    experience,
    updateDataObjectsOnline,
    updateDefinitionsOnline,
    updateDefinitionsAndDataOnline,
    editEntryUpdateProp,
  } = props;

  const [state, dispatch] = useReducer(reducer, props, initStateFromProps);
  const {
    primaryState: {
      context: { definitionAndDataIdsMapList },
      common: commonState,
      editingData,
      editingMultipleDefinitions,
      submissionResponse,
    },
    definitionsStates,
    dataStates,
  } = state;

  return (
    <EditEnryContext.Provider
      value={{
        editEntryUpdateProp,
        dispatch,
        updateDataObjectsOnline,
        updateDefinitionsAndDataOnline,
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
        <ErrorBoundary fallback={ErrorBoundaryFallBack}>
          <Modal.Header>
            <div> Edit Entry </div>

            <div className="experience-title" id="edit-entry-experience-title">
              {experience.title}
            </div>
          </Modal.Header>

          <SubmissionSuccessResponseComponent state={submissionResponse} />
          <SubmissionErrorsComponent state={submissionResponse} />

          <Modal.Content>
            <Form>
              {definitionAndDataIdsMapList.map((map, index) => {
                const { definitionId, dataId } = map;

                return (
                  <Fragment key={index}>
                    {!!definitionId && (
                      <DefinitionComponent
                        dispatch={dispatch}
                        key={definitionId}
                        id={definitionId}
                        state={definitionsStates[definitionId]}
                        shouldSubmit={getIdOfSubmittingDefinition(
                          definitionId,
                          editingData,
                          editingMultipleDefinitions,
                        )}
                        onSubmit={submit({
                          dispatch,
                          globalState: state,
                          updateDataObjectsOnline,
                          updateDefinitionsAndDataOnline,
                          updateDefinitionsOnline,
                          editEntryUpdateProp,
                        })}
                      />
                    )}

                    {!!dataId && (
                      <DataComponent
                        key={dataId}
                        state={dataStates[dataId]}
                        id={dataId}
                      />
                    )}
                  </Fragment>
                );
              })}

              {editingData.value === "active" && (
                <Button
                  positive={true}
                  compact={true}
                  type="submit"
                  id="edit-entry-submit"
                  className="edit-entry-definition-submit"
                  onClick={submit({
                    dispatch,
                    globalState: state,
                    updateDataObjectsOnline,
                    updateDefinitionsAndDataOnline,
                    updateDefinitionsOnline,
                    editEntryUpdateProp,
                  })}
                >
                  Submit
                </Button>
              )}
            </Form>
          </Modal.Content>
        </ErrorBoundary>
      </Modal>
    </EditEnryContext.Provider>
  );
}

function ErrorBoundaryFallBack() {
  return (
    <>
      <Modal.Header id="edit-entry-error-fallback">
        <div>Edit Entry</div>
      </Modal.Header>

      <Modal.Content>
        We are sorry something&apos;s gone wrong. Please try again at a later
        time.
      </Modal.Content>
    </>
  );
}

function SubmissionSuccessResponseComponent({
  state,
}: {
  state: SubmissionResponseState;
}) {
  const { dispatch } = useContext(EditEnryContext);

  if (state.value === "submissionSuccess") {
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
            <>
              {!!validResponse.successes && (
                <div>
                  <span>{validResponse.successes} </span>
                  <span>succeeded</span>
                </div>
              )}

              {!!validResponse.failures && (
                <div>
                  <span> {validResponse.failures} </span>
                  <span>failed</span>
                </div>
              )}
            </>
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
  type: DataTypes,
  id: string,
  dispatch: DispatchType,
  fieldName: string,
  fieldValue: FormObjVal,
) {
  const onChange =
    type === DataTypes.DATE || type === DataTypes.DATETIME
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
  const hasSuccess =
    state.value === "idle" && state.idle.context.anyEditSuccess;

  return (
    <Form.Field
      id={idPrefix}
      className={makeClassNames({
        "definition--success": hasSuccess,
      })}
      error={!!error}
    >
      {state.value === "idle" && (
        <>
          <label>{typeText}</label>

          <Input className="idle-definition-name">
            <input
              id={`${idPrefix}-name`}
              value={defaultFormValue}
              disabled={true}
            />

            <Button
              className={makeClassNames({
                "definition-edit": true,
                "definition-edit--success": hasSuccess,
              })}
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
          </Input>
        </>
      )}

      {state.value === "editing" && (
        <>
          <label htmlFor={`${idPrefix}-input`}>{typeText}</label>

          <Input
            onChange={(_, { value }) => {
              dispatch({
                type: ActionTypes.DEFINITION_NAME_CHANGED,
                id,
                formValue: value,
              });
            }}
            className="definition-input"
          >
            <input
              id={`${idPrefix}-input`}
              name={`${idPrefix}-input`}
              value={state.editing.context.formValue}
              autoComplete="off"
              className={makeClassNames({
                "definition-input-unchanged":
                  state.editing.value === "unchanged",
              })}
            />

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
          </Input>

          {state.editing.value === "changed" && (
            <Button.Group>
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
            </Button.Group>
          )}

          {!!error && (
            <FormCtrlError id={`${idPrefix}-error`}>{error}</FormCtrlError>
          )}
        </>
      )}
    </Form.Field>
  );
}

function SubmissionErrorsComponent({
  state,
}: {
  state: SubmissionResponseState;
}) {
  const { dispatch } = useContext(EditEnryContext);
  let errors: string | null = null;
  let id = "";

  if (state.value === "formErrors") {
    errors = state.formErrors.context.errors;
    id = "edit-entry-form-errors-message";
  } else if (state.value === "otherErrors") {
    errors = state.otherErrors.context.errors;
    id = "edit-entry-other-errors-message";
  } else if (state.value === "apolloErrors") {
    errors = state.apolloErrors.context.errors;
    id = "edit-entry-apollo-errors-message";
  }

  return errors ? (
    <Modal.Content id={id}>
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
  ) : null;
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

function submit(args: SubmitArgs) {
  return async function submitAllInner() {
    const {
      dispatch,
      globalState,
      updateDefinitionsAndDataOnline,
      editEntryUpdateProp,
      updateDataObjectsOnline,
      updateDefinitionsOnline,
    } = args;

    const [
      definitionsInput,
      definitionsWithFormErrors,
    ] = getDefinitionsToSubmit(globalState.definitionsStates) as [
      UpdateDefinitionInput[],
      string[],
    ];

    const [dataInput] = getDataObjectsToSubmit(globalState.dataStates);

    dispatch({
      type: ActionTypes.SUBMITTING,
      submittedCount:
        definitionsInput.length +
        definitionsWithFormErrors.length +
        dataInput.length,
    });

    if (definitionsWithFormErrors.length !== 0) {
      dispatch({
        type: ActionTypes.DEFINITION_FORM_ERRORS,
        ids: definitionsWithFormErrors,
      });

      return;
    }

    let success = false;

    try {
      const { experienceId } = globalState.primaryState.context;

      if (dataInput.length === 0) {
        const result = await updateDefinitionsOnline({
          variables: {
            input: {
              experienceId,
              definitions: definitionsInput,
            },
          },
          update: editEntryUpdateProp,
        });

        const data = result && result.data;

        if (data) {
          success = true;
          dispatch({
            type: ActionTypes.DEFINITIONS_SUBMISSION_RESPONSE,
            ...data,
          });
        }
      } else if (definitionsInput.length === 0) {
        const result1 = await updateDataObjectsOnline({
          variables: {
            input: dataInput,
          },

          update: editEntryUpdateProp,
        });

        const successResult = result1 && result1.data;

        if (successResult) {
          success = true;
          dispatch({
            type: ActionTypes.DATA_OBJECTS_SUBMISSION_RESPONSE,
            ...successResult,
          });
        }
      } else {
        const result = await updateDefinitionsAndDataOnline({
          variables: {
            definitionsInput: {
              experienceId,

              definitions: definitionsInput,
            },
            dataInput,
          },

          update: editEntryUpdateProp,
        });

        const successResult = result && result.data;

        if (successResult) {
          success = true;
          dispatch({
            type: ActionTypes.SUBMISSION_RESPONSE,
            ...successResult,
          });
        }
      }

      if (success === false) {
        dispatch({
          type: ActionTypes.OTHER_ERRORS,
        });
      }
    } catch (errors) {
      if (errors instanceof ApolloError) {
        dispatch({
          type: ActionTypes.APOLLO_ERRORS,
          errors,
        });
      } else {
        dispatch({
          type: ActionTypes.OTHER_ERRORS,
        });
      }
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
  editingData: PrimaryState["editingData"],
  editingMultipleDefinitions: IStateMachine["primaryState"]["editingMultipleDefinitions"],
) {
  if (editingData.value === "active") {
    return false;
  }

  if (editingMultipleDefinitions.value === "inactive") {
    return true;
  }

  const {
    context: { firstChangedDefinitionId },
  } = editingMultipleDefinitions;

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
  updateDefinitionsOnline: UpdateDefinitionsOnlineMutationFn;
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

interface SubmitArgs
  extends UpdateDefinitionsAndDataOnlineProps,
    UpdateDataObjectsOnlineMutationProps,
    UpdateDefinitionsOnlineProps,
    EditEntryUpdateProps {
  dispatch: DispatchType;
  globalState: IStateMachine;
}

// istanbul ignore next:
export function EditEntry(props: OwnProps) {
  const [updateDataObjectsOnline] = useUpdateDataObjectsOnlineMutation();
  const [updateDefinitionsOnline] = useUpdateDefinitionsOnline();
  const [updateDefinitionsAndDataOnline] = useUpdateDefinitionAndDataOnline();

  return (
    <EditEntryComponent
      updateDataObjectsOnline={updateDataObjectsOnline}
      updateDefinitionsOnline={updateDefinitionsOnline}
      updateDefinitionsAndDataOnline={updateDefinitionsAndDataOnline}
      editEntryUpdateProp={editEntryUpdate}
      {...props}
    />
  );
}
