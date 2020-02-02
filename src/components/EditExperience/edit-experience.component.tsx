import React, {
  useReducer,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
} from "react";
import makeClassNames from "classnames";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import "./edit-experience.styles.scss";
import {
  Props,
  ActionType,
  reducer,
  initState,
  CallerProps,
  StateValue,
  effectFunctions,
  FieldServerError,
} from "./edit-experience.utils";
import { useUpdateExperiencesOnlineMutation } from "../../graphql/update-experience.mutation";
import { LayoutContext } from "../Layout/layout.utils";
import { Loading } from "../Loading/loading";
import {
  domPrefix,
  titleInputId,
  descriptionInputId,
  submitBtnId,
  resetFormFieldsBtnId,
  errorsNotificationId,
  closeSubmitNotificationBtnSelector,
  titleInputErrorId,
  warningNotificationId,
  closeModalBtnId,
  successNotificationId,
  definitionErrorSelector,
  scrollToTopId,
} from "./edit-experience.dom";
import { EbnisAppContext } from "../../context";
import {
  updateExperienceOfflineResolvers,
  useUpdateExperienceOfflineMutation,
} from "./edit-experience.resolvers";
import { ActionType as ExperienceActype } from "../Experience/experience.utils";

enum ClickContext {
  submit = "@edit-experience/submit",
  resetForm = "@edit-experience/reset-form",
  closeModal = "@edit-experience/close-modal",
  closeSubmitNotification = "@edit-experience/close-submit-notification",
}

export function EditExperience(props: Props) {
  const { experience, parentDispatch, client } = props;

  const [stateMachine, dispatch] = useReducer(
    reducer,
    { experience },
    initState,
  );

  const {
    states: {
      dataDefinitions: definitionsState,
      submission: submissionState,
      meta: {
        fields: { title: titleState, description: descriptionState },
      },
    },
    effects: { general: generalEffects },
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

  useLayoutEffect(() => {
    client.addResolvers(updateExperienceOfflineResolvers);
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  let titleValue = titleState.context.defaults;
  let titleError = "";

  if (titleState.states.value === StateValue.changed) {
    titleValue = titleState.states.changed.context.formValue;

    if (titleState.states.changed.states.value === StateValue.invalid) {
      titleError =
        titleState.states.changed.states.invalid.context.errors[0][1];
    }
  }

  let descriptionValue = descriptionState.context.defaults;

  if (descriptionState.states.value === StateValue.changed) {
    descriptionValue = descriptionState.states.changed.context.formValue;
  }

  const onClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const { dataset } = target;

    switch (dataset.clickContext) {
      case ClickContext.submit:
        dispatch({
          type: ActionType.SUBMITTING,
        });
        break;

      case ClickContext.closeModal:
        parentDispatch({
          type: ExperienceActype.ABORTED,
        });
        break;

      case ClickContext.resetForm:
        dispatch({
          type: ActionType.RESET_FORM_FIELDS,
        });
        break;

      case ClickContext.closeSubmitNotification:
        dispatch({
          type: ActionType.CLOSE_SUBMIT_NOTIFICATION,
        });
        break;
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  return (
    <div className="bulma">
      {submissionState.value === StateValue.submitting && <Loading />}

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
      <div onClick={onClick as any} className="modal is-active" id={domPrefix}>
        <div className="modal-background" />

        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Edit Experience</p>

            <button
              className="delete"
              aria-label="close"
              data-click-context={ClickContext.closeModal}
              id={closeModalBtnId}
            />
          </header>

          <section className="modal-card-body">
            <span id={scrollToTopId} className="visually-hidden" />

            {submissionState.value === StateValue.success && (
              <div
                id={successNotificationId}
                className="notification is-success is-light"
              >
                <button
                  data-click-context={ClickContext.closeSubmitNotification}
                  className={`delete ${closeSubmitNotificationBtnSelector}`}
                />
                Changes saved successfully.
              </div>
            )}

            {submissionState.value === StateValue.warning && (
              <div
                id={warningNotificationId}
                className="notification is-warning is-light"
              >
                <button
                  data-click-context={ClickContext.closeSubmitNotification}
                  className={`delete ${closeSubmitNotificationBtnSelector}`}
                />
                {submissionState.warning.context.warning}
              </div>
            )}

            {submissionState.value === StateValue.errors && (
              <div
                className="notification is-danger is-light"
                id={errorsNotificationId}
              >
                <button
                  data-click-context={ClickContext.closeSubmitNotification}
                  className={`delete ${closeSubmitNotificationBtnSelector}`}
                />
                {submissionState.errors.context.errors}
              </div>
            )}

            <form>
              <div
                className={makeClassNames({
                  field: true,
                  error: !!titleError,
                })}
              >
                <label className="label">Title</label>

                <div className="control">
                  <input
                    className="input"
                    type="text"
                    placeholder="Text input"
                    value={titleValue}
                    id={titleInputId}
                    onChange={e => {
                      dispatch({
                        type: ActionType.FORM_CHANGED,
                        text: e.currentTarget.value,
                        fieldName: "title",
                      });
                    }}
                  />
                </div>

                {titleError && (
                  <FormCtrlError id={titleInputErrorId}>
                    {titleError}
                  </FormCtrlError>
                )}
              </div>

              <div className="field">
                <label className="label">Description</label>

                <div className="control">
                  <textarea
                    id={descriptionInputId}
                    className="textarea"
                    placeholder="Textarea"
                    onChange={e => {
                      dispatch({
                        type: ActionType.FORM_CHANGED,
                        text: e.currentTarget.value,
                        fieldName: "description",
                      });
                    }}
                    value={descriptionValue}
                  />
                </div>
              </div>

              <hr />

              {Object.entries(definitionsState).map(
                ([id, definition], index) => {
                  const {
                    context: { defaultName },
                    states,
                  } = definition;

                  let value = defaultName;
                  let error: null | FieldServerError = null;

                  if (states.value === StateValue.changed) {
                    value = states.changed.context.formValue;

                    if (states.changed.states.value === StateValue.invalid) {
                      error = states.changed.states.invalid.context.errors;
                    }
                  }

                  const index1 = index + 1;

                  return (
                    <div
                      key={id}
                      className={makeClassNames({
                        field: true,
                        error: !!error,
                      })}
                    >
                      <label className="label">Data Field {index1}</label>

                      <div className="control">
                        <input
                          className="input"
                          type="text"
                          placeholder="Text input"
                          value={value}
                          id={id}
                          onChange={e => {
                            dispatch({
                              type: ActionType.DEFINITION_CHANGED,
                              text: e.currentTarget.value,
                              id,
                            });
                          }}
                        />
                      </div>

                      {error && (
                        <FormCtrlError
                          className={makeClassNames({
                            [definitionErrorSelector]: true,
                          })}
                        >
                          {error.map(([k, e], index) => {
                            return (
                              <div key={index}>
                                {k}: {e}
                              </div>
                            );
                          })}
                        </FormCtrlError>
                      )}
                    </div>
                  );
                },
              )}
            </form>
          </section>

          <footer className="modal-card-foot">
            <button
              type="submit"
              className="button is-success"
              id={submitBtnId}
              data-click-context={ClickContext.submit}
            >
              Save changes
            </button>

            <button
              id={resetFormFieldsBtnId}
              className="button is-warning"
              data-click-context={ClickContext.resetForm}
            >
              Reset
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

// istanbul ignore next:
export default (props: CallerProps) => {
  const [updateExperiencesOnline] = useUpdateExperiencesOnlineMutation();
  const { hasConnection } = useContext(LayoutContext);
  const { client, persistor, cache } = useContext(EbnisAppContext);
  const [updateExperienceOffline] = useUpdateExperienceOfflineMutation();

  return (
    <EditExperience
      {...props}
      updateExperiencesOnline={updateExperiencesOnline}
      hasConnection={hasConnection}
      client={client}
      persistor={persistor}
      cache={cache}
      updateExperienceOffline={updateExperienceOffline}
    />
  );
};
