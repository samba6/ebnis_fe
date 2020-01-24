import React, {
  useReducer,
  useContext,
  Fragment,
  useEffect,
  useCallback,
} from "react";
import {
  ComponentProps,
  ActionType,
  initState,
  reducer,
  DefinitionState,
  DispatchType,
  DefinitionsStates,
  DataState,
  EditEnryContext,
  StateMachine,
  Submission,
  CallerProps,
  StateValue,
  effectFunctions,
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
  useUpdateDataObjectsOnlineMutation,
  useUpdateDefinitionsOnline,
  useUpdateDefinitionAndDataOnline,
  UpdateDefinitionsOnlineMutationFn,
} from "../../graphql/update-definition-and-data.mutation";
import {
  formErrorsDomId,
  otherErrorsDomId,
  apolloErrorsDomId,
  getDefinitionFieldSelectorClass,
  getDefinitionControlId,
  ControlName,
  getDataControlDomId,
  offlineSyncButtonId,
  makeOfflineDefinitionLabelId,
  scrollToTopId,
} from "./edit-entry-dom";
import { useCreateOnlineEntryMutation } from "../../graphql/create-entry.mutation";
import { EbnisAppContext } from "../../context";
import { LayoutUnchangingContext, LayoutContext } from "../Layout/layout.utils";
import { MUTATION_NAME_createEntry } from "../../graphql/create-entry.mutation";
import { cleanupRanQueriesFromCache } from "../../apollo-cache/cleanup-ran-queries-from-cache";
import { QUERY_NAME_getOfflineItems } from "../UploadOfflineItems/upload-offline.resolvers";
import { QUERY_NAME_getExperienceFull } from "../../graphql/get-experience-full.query";
import {
  MUTATION_NAME_updateDataObjects,
  MUTATION_NAME_updateDefinitions,
} from "../../graphql/update-definition-and-data.mutation";
import { useCreateOfflineEntryMutation } from "../NewEntry/new-entry.resolvers";
import { addNewEntryResolvers } from "../NewEntry/new-entry.injectables";

export function EditEntryComponent(props: ComponentProps) {
  const { dispatch: parentDispatch, experience, hasConnection } = props;

  const [stateMachine, dispatch] = useReducer(reducer, props, initState);
  const {
    context: { definitionAndDataIdsMapList },
    effects: { general: generalEffects },
    states: {
      editingData,
      editingDefinition,
      submission,
      definitionsStates,
      dataStates,
      mode,
    },
  } = stateMachine;

  useEffect(() => {
    if (generalEffects.value !== StateValue.hasEffects) {
      return;
    }

    for (const { key, ownArgs } of generalEffects.hasEffects.context.effects) {
      effectFunctions[key](
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        ownArgs as any,
        props,
        { dispatch },
      );
    }

    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [generalEffects]);

  const onSubmit = useCallback(
    function onSubmitCallback() {
      dispatch({
        type: ActionType.SUBMITTING,
        hasConnection,
      });
      /* eslint-disable-next-line react-hooks/exhaustive-deps*/
    },
    [hasConnection],
  );

  useEffect(() => {
    const { client, cache, persistor } = props;
    addNewEntryResolvers(client);

    return () =>
      cleanupRanQueriesFromCache(
        cache,
        [
          MUTATION_NAME_updateDataObjects,
          MUTATION_NAME_updateDefinitions,
          MUTATION_NAME_createEntry,
          QUERY_NAME_getOfflineItems,
          QUERY_NAME_getExperienceFull + "(",
        ],
        persistor,
      );
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  return (
    <EditEnryContext.Provider
      value={{
        dispatch,
        onSubmit,
        hasConnection,
      }}
    >
      {submission.value === StateValue.submitting && <SubmittingOverlay />}

      <Modal
        id="edit-entry-modal"
        open={true}
        closeIcon={true}
        onClose={() => {
          if (submission.value === StateValue.submitting) {
            return;
          }

          parentDispatch({
            type: ActionType.DESTROYED,
          });
        }}
        dimmer="inverted"
        closeOnDimmerClick={false}
        className="max-w-sm components-edit-entry"
      >
        <ErrorBoundary fallback={ErrorBoundaryFallBack}>
          <Modal.Header>
            <div> Edit Entry </div>

            <div className="experience-title" id="edit-entry-experience-title">
              {experience.title}
            </div>
          </Modal.Header>

          {hasConnection &&
            (mode.value === StateValue.modifiedOffline ||
              mode.value === StateValue.offline) && (
              <div className="mt-5 text-center">
                <button
                  className="p-5 text-red-900 bg-red-200 rounded-lg cursor-pointer "
                  onClick={onSubmit}
                  id={offlineSyncButtonId}
                >
                  Sync Now
                </button>
              </div>
            )}

          <span id={scrollToTopId} className="visually-hidden" />

          <SubmissionSuccessResponseComponent
            state={submission}
            dispatch={dispatch}
          />

          <SubmissionErrorsComponent dispatch={dispatch} state={submission} />

          <Modal.Content>
            <Form>
              {definitionAndDataIdsMapList.map((map, index) => {
                const { definitionId, dataId } = map;

                return (
                  <Fragment key={index}>
                    {!!definitionId && (
                      <DefinitionComponent
                        key={definitionId}
                        id={definitionId}
                        state={definitionsStates[definitionId]}
                        shouldSubmit={getIdOfSubmittingDefinition(
                          definitionId,
                          editingData,
                          editingDefinition,
                        )}
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
  dispatch,
}: {
  state: Submission;
  dispatch: DispatchType;
}) {
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
              type: ActionType.DISMISS_SUBMISSION_RESPONSE_MESSAGE,
            });
          }}
        >
          {validResponse && (
            <div className="mt-5">
              {!!validResponse.successes && (
                <div className="pt-1 pl-2 bg-green-300">
                  <span>{validResponse.successes} </span>
                  <span>succeeded</span>
                </div>
              )}

              {!!validResponse.failures && (
                <div className="pt-1 pl-2 bg-red-300">
                  <span> {validResponse.failures} </span>
                  <span>failed</span>
                </div>
              )}
            </div>
          )}

          {invalidResponse && (
            <div className="bg-red-300">
              {invalidResponse.data && <span>{invalidResponse.data}</span>}

              {invalidResponse.definitions && (
                <span>{invalidResponse.definitions}</span>
              )}
            </div>
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

  const idPrefix = getDataControlDomId(id, ControlName.input);

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
      className={makeClassNames({
        "data--success":
          state.value === "unchanged" && state.unchanged.context.anyEditSuccess,
      })}
      error={!!formErrorsComponent}
    >
      {component}

      {!!formErrorsComponent && (
        <FormCtrlError id={getDataControlDomId(id, ControlName.error)}>
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
  domId: string,
  fieldValue: FormObjVal,
) {
  const onChange =
    type === DataTypes.DATE || type === DataTypes.DATETIME
      ? (_: string, val: FormObjVal) => {
          dispatch({
            type: ActionType.DATA_CHANGED,
            id,
            rawFormVal: val,
          });
        }
      : (_: E, { value: rawFormVal }: InputOnChangeData) => {
          dispatch({
            type: ActionType.DATA_CHANGED,
            id,
            rawFormVal,
          });
        };

  const props = {
    id: domId,
    value: fieldValue,
    name: domId,
    onChange,
  };

  return componentFromDataType(type, props);
}

function DefinitionComponent(props: DefinitionComponentProps) {
  const { id, state, shouldSubmit } = props;
  const { onSubmit, dispatch, hasConnection } = useContext(EditEnryContext);

  const { type, name: defaultFormValue } = state.context.defaults;
  const inputId = getDefinitionControlId(id, ControlName.input);
  const error = getDefinitionFormError(state);
  const hasSuccess =
    state.value === "idle" && state.idle.context.anyEditSuccess;

  return (
    <Form.Field
      className={makeClassNames({
        "definition--success": hasSuccess,
        "definition-field": true,
        [getDefinitionFieldSelectorClass(id)]: true,
      })}
      error={!!error}
    >
      <label htmlFor={inputId}>
        {!hasConnection && (
          <span
            id={makeOfflineDefinitionLabelId(id)}
            className="relative mr-2"
            style={{ bottom: "-0.15625rem" }}
          >
            {defaultFormValue}
          </span>
        )}
        [
        <span className="relative" style={{ bottom: "-0.15rem" }}>
          {type}
        </span>
        ]
      </label>

      {hasConnection && (
        <>
          {state.value === "idle" && (
            <>
              <Input className="definition-input">
                <input
                  id={getDefinitionControlId(id, ControlName.name)}
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
                  id={getDefinitionControlId(id, ControlName.edit)}
                  onClick={() =>
                    dispatch({
                      type: ActionType.EDIT_BTN_CLICKED,
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
                    type: ActionType.DEFINITION_NAME_CHANGED,
                    id,
                    formValue: value,
                  });
                }}
                className="definition-input"
              >
                <input
                  id={inputId}
                  name={inputId}
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
                  id={getDefinitionControlId(id, ControlName.dismiss)}
                  onClick={() => {
                    dispatch({
                      type: ActionType.STOP_DEFINITION_EDIT,
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
                    id={getDefinitionControlId(id, ControlName.reset)}
                    onClick={() => {
                      dispatch({
                        type: ActionType.UNDO_DEFINITION_EDITS,
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
                      id={getDefinitionControlId(id, ControlName.submit)}
                      onClick={onSubmit}
                      className="edit-entry-definition-submit"
                    >
                      Submit
                    </Button>
                  )}
                </Button.Group>
              )}

              {!!error && (
                <FormCtrlError
                  id={getDefinitionControlId(id, ControlName.error)}
                >
                  {error}
                </FormCtrlError>
              )}
            </>
          )}
        </>
      )}
    </Form.Field>
  );
}

function SubmissionErrorsComponent({
  state,
  dispatch,
}: {
  state: Submission;
  dispatch: DispatchType;
}) {
  if (state.value === StateValue.inactive) {
    return null;
  }

  let errors: string | null = null;
  let id = "";

  if (state.value === "formErrors") {
    errors = state.formErrors.context.errors;
    id = formErrorsDomId;
  } else if (state.value === StateValue.otherErrors) {
    errors = state.otherErrors.context.errors;
    id = otherErrorsDomId;
  } else if (state.value === StateValue.apolloErrors) {
    errors = state.apolloErrors.context.errors;
    id = apolloErrorsDomId;
  }

  return errors ? (
    <Modal.Content id={id}>
      <Message
        onDismiss={() => {
          dispatch({
            type: ActionType.DISMISS_SUBMISSION_RESPONSE_MESSAGE,
          });
        }}
        error={true}
      >
        {errors}
      </Message>
    </Modal.Content>
  ) : null;
}

function getIdOfSubmittingDefinition(
  id: string,
  editingData: StateMachine["states"]["editingData"],
  editingDefinition: StateMachine["states"]["editingDefinition"],
) {
  if (editingData.value === "active") {
    return false;
  }

  if (editingDefinition.value !== StateValue.multiple) {
    return true;
  }

  const {
    context: { mostRecentlyChangedDefinitionId },
  } = editingDefinition.multiple;

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
  return Object.entries(obj).reduce((acc, [k, v]) => {
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
  }, [] as JSX.Element[]);
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
  shouldSubmit: boolean;
}

interface DataComponentProps {
  id: string;
  state: DataState;
}

type E = React.ChangeEvent<HTMLInputElement>;

// istanbul ignore next:
export function EditEntry(props: CallerProps) {
  const { client, persistor, cache } = useContext(EbnisAppContext);
  const { layoutDispatch } = useContext(LayoutUnchangingContext);
  const { hasConnection } = useContext(LayoutContext);
  const [updateDataObjectsOnline] = useUpdateDataObjectsOnlineMutation();
  const [updateDefinitionsOnline] = useUpdateDefinitionsOnline();
  const [updateDefinitionsAndDataOnline] = useUpdateDefinitionAndDataOnline();
  const [createOnlineEntry] = useCreateOnlineEntryMutation();
  const [createOfflineEntry] = useCreateOfflineEntryMutation();

  return (
    <EditEntryComponent
      createOnlineEntry={createOnlineEntry}
      updateDataObjectsOnline={updateDataObjectsOnline}
      updateDefinitionsOnline={updateDefinitionsOnline}
      updateDefinitionsAndDataOnline={updateDefinitionsAndDataOnline}
      client={client}
      persistor={persistor}
      cache={cache}
      layoutDispatch={layoutDispatch}
      hasConnection={hasConnection}
      createOfflineEntry={createOfflineEntry}
      {...props}
    />
  );
}
