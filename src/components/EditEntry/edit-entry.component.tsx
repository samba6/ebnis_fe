import React, {
  useReducer,
  useContext,
  Fragment,
  useEffect,
  useCallback,
} from "react";
import {
  EditEntryComponentProps,
  ActionTypes,
  initStateFromProps,
  reducer,
  DefinitionState,
  DispatchType,
  DefinitionsStates,
  DataState,
  EditEnryContext,
  IStateMachine,
  SubmissionResponseState,
  PrimaryState,
  EditEntryCallerProps,
  EFFECT_VALUE_HAS_EFFECTS,
  EDITING_DEFINITION_MULTIPLE,
} from "./edit-entry-utils";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import makeClassNames from "classnames";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import "./edit-entry.styles.scss";
import { SubmittingOverlay } from "../SubmittingOverlay/submitting-overlay";
import { componentFromDataType } from "../NewEntry/component-from-data-type";
import { FormObjVal } from "../Experience/experience.utils";
import { InputOnChangeData } from "semantic-ui-react";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";
import { UpdateDataObjectsResponseFragment_fieldErrors } from "../../graphql/apollo-types/UpdateDataObjectsResponseFragment";
import { ErrorBoundary } from "../ErrorBoundary/error-boundary.component";
import {
  editEntryUpdate,
  useUpdateDataObjectsOnlineMutation,
  useUpdateDefinitionsOnline,
  useUpdateDefinitionAndDataOnline,
  EditEntryUpdateProps,
  UpdateDefinitionsAndDataOnlineMutationComponentProps,
  UpdateDataObjectsOnlineMutationComponentProps,
  UpdateDefinitionsOnlineMutationComponentProps,
  UpdateDefinitionsOnlineMutationFn,
} from "./edit-entry.injectables";
import { useDeleteCachedQueriesAndMutationsOnUnmount } from "../use-delete-cached-queries-mutations-on-unmount";
import {
  MUTATION_NAME_updateDataObjects,
  MUTATION_NAME_updateDefinitions,
} from "../../graphql/update-definition-and-data.mutation";
import {
  formErrorsDomId,
  otherErrorsDomId,
  apolloErrorsDomId,
} from "./edit-entry-dom";
import {
  useCreateOnlineEntryMutation,
  CreateOnlineEntryMutationComponentProps,
} from "../../graphql/create-entry.mutation";

export function EditEntryComponent(props: EditEntryComponentProps) {
  const {
    dispatch: parentDispatch,
    experience,
    updateDataObjectsOnline,
    updateDefinitionsOnline,
    updateDefinitionsAndDataOnline,
    editEntryUpdateProp,
    createOnlineEntry,
  } = props;

  const [state, dispatch] = useReducer(reducer, props, initStateFromProps);
  const {
    effects,
    primaryState: {
      context: { definitionAndDataIdsMapList },
      common: commonState,
      editingData,
      editingDefinition,
      submissionResponse,
    },
    definitionsStates,
    dataStates,
  } = state;

  useEffect(() => {
    if (effects.value === EFFECT_VALUE_HAS_EFFECTS) {
      for (const { func, args } of effects[EFFECT_VALUE_HAS_EFFECTS].context
        .effects) {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        func(args as any);
      }
    }
  }, [effects]);

  const onSubmit = useCallback(function onSubmitCallback() {
    dispatch({
      type: ActionTypes.SUBMITTING,
      createOnlineEntry,
      updateDefinitionsOnline,
      updateDefinitionsAndDataOnline,
      updateDataObjectsOnline,
      dispatch,
    });
  }, []);

  useDeleteCachedQueriesAndMutationsOnUnmount(
    [MUTATION_NAME_updateDataObjects, MUTATION_NAME_updateDefinitions],
    true,
  );

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
                          editingDefinition,
                        )}
                        onSubmit={onSubmit}
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
                  onClick={onSubmit}
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

  const component = getComponentFromDataType(
    state.context.defaults.type,
    id,
    dispatch,
    idPrefix,
    formValue,
  );

  const formErrorsComponent = getFormErrorsComponent(state);

  return (
    <Form.Field
      id={idPrefix}
      className={makeClassNames({
        "data--success":
          state.value === "unchanged" && state.unchanged.context.anyEditSuccess,
      })}
      error={!!formErrorsComponent}
    >
      {component}

      {!!formErrorsComponent && (
        <FormCtrlError id={`${idPrefix}-error`}>
          {formErrorsComponent}
        </FormCtrlError>
      )}
    </Form.Field>
  );
}

function getComponentFromDataType(
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
        "definition-field": true,
      })}
      error={!!error}
    >
      <label htmlFor={`${idPrefix}-input`}>{typeText}</label>

      {state.value === "idle" && (
        <>
          <Input className="definition-input">
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
    id = formErrorsDomId;
  } else if (state.value === "otherErrors") {
    errors = state.otherErrors.context.errors;
    id = otherErrorsDomId;
  } else if (state.value === "apolloErrors") {
    errors = state.apolloErrors.context.errors;
    id = apolloErrorsDomId;
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

function getIdOfSubmittingDefinition(
  id: string,
  editingData: PrimaryState["editingData"],
  editingDefinition: IStateMachine["primaryState"]["editingDefinition"],
) {
  if (editingData.value === "active") {
    return false;
  }

  if (editingDefinition.value !== EDITING_DEFINITION_MULTIPLE) {
    return true;
  }

  const {
    context: { mostRecentlyChangedDefinitionId },
  } = editingDefinition[EDITING_DEFINITION_MULTIPLE];

  return id === mostRecentlyChangedDefinitionId;
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

function getFormErrorsComponent(state: DataState) {
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
          <div key={k}>
            <div className="font-extrabold">{capitalize(k)}:</div>

            {v.split("\n").map((part, index) => {
              return (
                <div className="ml-2" key={index}>
                  {part}
                </div>
              );
            })}
          </div>,
        );
      }

      return acc;
    },
    [] as JSX.Element[],
  );
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
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

// istanbul ignore next:
export function EditEntry(props: EditEntryCallerProps) {
  const [updateDataObjectsOnline] = useUpdateDataObjectsOnlineMutation();
  const [updateDefinitionsOnline] = useUpdateDefinitionsOnline();
  const [updateDefinitionsAndDataOnline] = useUpdateDefinitionAndDataOnline();
  const [createOnlineEntry] = useCreateOnlineEntryMutation();

  return (
    <EditEntryComponent
      createOnlineEntry={createOnlineEntry}
      updateDataObjectsOnline={updateDataObjectsOnline}
      updateDefinitionsOnline={updateDefinitionsOnline}
      updateDefinitionsAndDataOnline={updateDefinitionsAndDataOnline}
      editEntryUpdateProp={editEntryUpdate}
      {...props}
    />
  );
}
