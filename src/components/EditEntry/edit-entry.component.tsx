import React, {
  useReducer,
  useContext,
  Fragment,
  useEffect,
  useCallback,
  ChangeEvent,
} from "react";
import {
  Props,
  ActionType,
  initState,
  reducer,
  DispatchType,
  DataState,
  EditEntryContext,
  Submission,
  CallerProps,
  StateValue,
  effectFunctions,
} from "./edit-entry-utils";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import makeClassNames from "classnames";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import "./edit-entry.styles.scss";
import { Loading } from "../Loading/loading";
import { componentFromDataType } from "../NewEntry/component-from-data-type";
import { FormObjVal } from "../Experience/experience.utils";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";
import { ErrorBoundary } from "../ErrorBoundary/error-boundary.component";
import {
  formErrorsDomId,
  otherErrorsDomId,
  ControlName,
  getDataControlDomId,
  scrollToTopId,
  editEntryComponentDomId,
  editEntrySubmissionResponseDomId,
  editEntrySubmitDomId,
} from "./edit-entry-dom";
import { EbnisAppContext } from "../../context";
import { LayoutUnchangingContext, LayoutContext } from "../Layout/layout.utils";
import { cleanupRanQueriesFromCache } from "../../apollo-cache/cleanup-ran-queries-from-cache";
import { QUERY_NAME_getExperienceFull } from "../../graphql/get-experience-full.query";
import { addNewEntryResolvers } from "../NewEntry/new-entry.injectables";
import { capitalize } from "../../general-utils";
import { useUpdateExperiencesOnlineMutation } from "../../graphql/experiences.mutation";
import { DataObjectErrorFragment } from "../../graphql/apollo-types/DataObjectErrorFragment";
import { ExperienceContext } from "../Experience/experience.utils";

export function EditEntryComponent(props: Props) {
  const { entryDispatch, experience, hasConnection } = props;

  const [stateMachine, dispatch] = useReducer(reducer, props, initState);
  const {
    effects: { general: generalEffects },
    states: { editingData, submission, dataStates },
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
          "getOfflineItems",
          QUERY_NAME_getExperienceFull + "(",
          "updateExperiences",
        ],
        persistor,
      );
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  return (
    <EditEntryContext.Provider
      value={{
        dispatch,
        onSubmit,
        hasConnection,
      }}
    >
      {submission.value === StateValue.submitting && <Loading />}

      <Modal
        id={editEntryComponentDomId}
        open={true}
        closeIcon={true}
        onClose={() => {
          // istanbul ignore next:
          if (submission.value === StateValue.submitting) {
            return;
          }

          entryDispatch({
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

          <span id={scrollToTopId} className="visually-hidden" />

          <SubmissionSuccessResponseComponent
            state={submission}
            dispatch={dispatch}
          />

          <SubmissionErrorsComponent dispatch={dispatch} state={submission} />

          <Modal.Content>
            <Form>
              {Object.entries(dataStates).map(([dataId, state], index) => {
                return (
                  <Fragment key={index}>
                    {!!dataId && (
                      <DataComponent key={dataId} state={state} id={dataId} />
                    )}
                  </Fragment>
                );
              })}

              {editingData.value === "active" && (
                <Button
                  positive={true}
                  compact={true}
                  type="submit"
                  id={editEntrySubmitDomId}
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
    </EditEntryContext.Provider>
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
      <Modal.Content id={editEntrySubmissionResponseDomId}>
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
  const { dispatch } = useContext(EditEntryContext);

  const {
    context: {
      defaults: { parsedVal, definitionName, type },
    },
  } = state;

  const formValue =
    state.value === "changed" ? state.changed.context.formValue : parsedVal;

  const idPrefix = getDataControlDomId(id, ControlName.input);

  const component = getComponentFromDataType(
    type,
    id,
    dispatch,
    idPrefix,
    formValue,
  );

  const formErrorsComponent = getFormErrorsComponent(state);

  return (
    <>
      <Form.Field className="definition-field">
        <label>
          <span className="relative mr-2" style={{ bottom: "-0.15625rem" }}>
            {definitionName}
          </span>
          [
          <span className="relative" style={{ bottom: "-0.15rem" }}>
            {type}
          </span>
          ]
        </label>
      </Form.Field>

      <Form.Field
        className={makeClassNames({
          "data--success":
            state.value === "unchanged" &&
            state.unchanged.context.anyEditSuccess,
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
    </>
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
      : (e: ChangeEvent<HTMLInputElement>) => {
          dispatch({
            type: ActionType.DATA_CHANGED,
            id,
            rawFormVal: e.target.value,
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

function SubmissionErrorsComponent({
  state,
  dispatch,
}: {
  state: Submission;
  dispatch: DispatchType;
}) {
  let errors = "";
  let id = "";

  if (state.value === "formErrors") {
    errors = state.formErrors.context.errors;
    id = formErrorsDomId;
  } else if (state.value === StateValue.otherErrors) {
    errors = state.otherErrors.context.errors;
    id = otherErrorsDomId;
  } else {
    return null;
  }

  return (
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
  );
}

function getFormErrorsComponent(state: DataState) {
  if (state.value === "changed") {
    const { changed } = state;

    let errors = {} as DataObjectErrorFragment;

    if (changed.value === "serverErrors") {
      errors = changed.serverErrors.context.errors;

      return getNodesFromObject((errors as unknown) as { [k: string]: string });
    }
  }

  return null;
}

function getNodesFromObject(obj: { [k: string]: string }) {
  return Object.entries(obj).reduce((acc, [k, v]) => {
    if (v) {
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
  const [updateExperiencesOnline] = useUpdateExperiencesOnlineMutation();
  const { experienceDispatch } = useContext(ExperienceContext);

  return (
    <EditEntryComponent
      updateExperiencesOnline={updateExperiencesOnline}
      client={client}
      persistor={persistor}
      cache={cache}
      layoutDispatch={layoutDispatch}
      hasConnection={hasConnection}
      experienceDispatch={experienceDispatch}
      {...props}
    />
  );
}
