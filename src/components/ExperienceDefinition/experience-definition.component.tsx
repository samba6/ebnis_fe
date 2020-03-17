import React, { useReducer, useContext, useEffect } from "react";
import "./experience-definition.styles.scss";
import {
  Props,
  CallerProps,
  initState,
  reducer,
  StateValue,
  effectFunctions,
  ActionType,
  fieldTypeKeys,
  Submission,
  DispatchType,
  FormValidity,
} from "./experience-definition.utils";
import {
  scrollIntoViewDomId,
  titleInputDomId,
  descriptionInputDomId,
  definitionNameInputDomId,
  definitionTypeInputDomId,
  makeDefinitionTypeOptionDomId,
  submitDomId,
  resetDomId,
  notificationErrorCloseId,
  notificationWarningCloseId,
  revealDescriptionInputDomId,
  hideDescriptionInputDomId,
  makeDefinitionContainerDomId,
  moveDownDefinitionSelector,
  moveUpDefinitionSelector,
  removeDefinitionSelector,
  addDefinitionSelector,
} from "./experience-definition.dom";
import { EbnisAppContext } from "../../context";
import { useCreateExperienceOfflineMutation } from "./experience-definition.resolvers";
import { useCreateExperiencesMutation } from "../../graphql/experiences.gql";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { DataTypes } from "../../graphql/apollo-types/globalTypes";
import { Loading } from "../Loading/loading";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import { FieldError } from "../../general-utils";
import makeClassName from "classnames";
import { addResolvers } from "./experience-definition.injectables";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { EXPERIENCE_DEFINITION_TITLE } from "../../constants/experience-definition-title";

export function ExperienceDefinitionComponent(props: Props) {
  const { client } = props;
  const [stateMachine, dispatch] = useReducer(reducer, undefined, initState);

  const {
    states: {
      submission: submissionState,
      form: {
        validity: formValidity,
        fields: {
          title: titleState,
          description: descriptionState,
          dataDefinitions: dataDefinitionsStates,
        },
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

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(EXPERIENCE_DEFINITION_TITLE));
    addResolvers(client);

    return setDocumentTitle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let titleValue = "";
  let titleErrors: null | FieldError = null;

  if (titleState.states.value === StateValue.changed) {
    const {
      context: { formValue },
      states,
    } = titleState.states.changed;
    titleValue = formValue;

    if (states.value === StateValue.invalid) {
      titleErrors = states.invalid.context.errors;
    }
  }

  let descriptionValue = "";
  let descriptionActive = false;
  if (descriptionState.value === StateValue.active) {
    const activeState = descriptionState.active;
    descriptionActive = true;

    if (activeState.states.value === StateValue.changed) {
      const changedState = activeState.states.changed;
      descriptionValue = changedState.context.formValue;
    }
  }

  const definitionsLen = dataDefinitionsStates.length;

  return (
    <div className="components-experience-definition">
      <SidebarHeader title="New Experience Definition" sidebar={true} />

      <div className="main">
        <span
          className="visually-hidden"
          id={scrollIntoViewDomId}
          style={{
            position: "relative",
            top: "-40px",
          }}
        />

        <ErrorOrWarning
          formValidity={formValidity}
          submissionState={submissionState}
          dispatch={dispatch}
        />

        <form
          className="form"
          onSubmit={e => {
            e.preventDefault();
            dispatch({
              type: ActionType.SUBMITTING,
            });
          }}
        >
          <label
            htmlFor={titleInputDomId}
            className={makeClassName({
              form__field: true,
              "form__field--errors": !!titleErrors,
            })}
          >
            <div className="form__label">Title</div>

            <input
              className="form__control"
              type="text"
              id={titleInputDomId}
              value={titleValue}
              onChange={e => {
                const node = e.currentTarget;
                dispatch({
                  type: ActionType.FORM_CHANGED,
                  key: "non-def",
                  value: node.value,
                  fieldName: "title",
                });
              }}
            />

            {titleErrors && (
              <FormCtrlError id={titleInputDomId + "-errors"}>
                {titleErrors.map(([errorLabel, errorText], index) => {
                  return (
                    <div key={index}>
                      <span>{errorLabel} </span>
                      <span>{errorText}</span>
                    </div>
                  );
                })}
              </FormCtrlError>
            )}
          </label>

          <div className="form__field">
            <label
              htmlFor={descriptionInputDomId}
              className="form__label form__label-description"
            >
              <span>Description</span>

              {descriptionActive ? (
                <div
                  className="form__label-description-toggle"
                  id={hideDescriptionInputDomId}
                  onClick={() => {
                    dispatch({
                      type: ActionType.TOGGLE_DESCRIPTION,
                    });
                  }}
                >
                  <span className="chevron-down " />
                </div>
              ) : (
                <div
                  id={revealDescriptionInputDomId}
                  className="form__label-description-toggle"
                  onClick={() => {
                    dispatch({
                      type: ActionType.TOGGLE_DESCRIPTION,
                    });
                  }}
                >
                  <span className="chevron-up" />
                </div>
              )}
            </label>

            <textarea
              rows={7}
              className={makeClassName({
                form__control: true,
                "form__control--hidden": !descriptionActive,
              })}
              id={descriptionInputDomId}
              value={descriptionValue}
              onChange={e => {
                const node = e.currentTarget;
                dispatch({
                  type: ActionType.FORM_CHANGED,
                  key: "non-def",
                  value: node.value,
                  fieldName: "description",
                });
              }}
            />
          </div>

          <div className="data-definitions">
            {dataDefinitionsStates.map(
              ({ id, name: nameState, type: typeState }, index) => {
                let nameValue = "";
                let nameErrors: null | FieldError = null;
                if (nameState.states.value === StateValue.changed) {
                  const {
                    states,
                    context: { formValue },
                  } = nameState.states.changed;
                  nameValue = formValue;

                  if (states.value === StateValue.invalid) {
                    nameErrors = states.invalid.context.errors;
                  }
                }

                let typeValue = "" as DataTypes;
                let typeErrors: null | FieldError = null;
                if (typeState.states.value === StateValue.changed) {
                  const {
                    states,
                    context: { formValue },
                  } = typeState.states.changed;
                  typeValue = formValue;

                  if (states.value === StateValue.invalid) {
                    typeErrors = states.invalid.context.errors;
                  }
                }

                return (
                  <div
                    key={id}
                    className={`data-definition`}
                    id={makeDefinitionContainerDomId(id)}
                  >
                    <label
                      htmlFor={definitionNameInputDomId + id}
                      className={makeClassName({
                        form__field: true,
                        "form__field--errors": !!nameErrors,
                      })}
                    >
                      <div className="form__label">Field name</div>

                      <input
                        type="text"
                        className="form__control"
                        id={definitionNameInputDomId + id}
                        value={nameValue}
                        onChange={e => {
                          const node = e.currentTarget;
                          dispatch({
                            type: ActionType.FORM_CHANGED,
                            key: "def",
                            index,
                            value: node.value,
                            fieldName: "name",
                          });
                        }}
                      />

                      {nameErrors && (
                        <FormCtrlError
                          id={definitionNameInputDomId + id + "-errors"}
                        >
                          {nameErrors.map(([errorLabel, errorText], index) => {
                            return (
                              <div key={index}>
                                <span>{errorLabel} </span>
                                <span>{errorText}</span>
                              </div>
                            );
                          })}
                        </FormCtrlError>
                      )}
                    </label>

                    <label
                      htmlFor={definitionTypeInputDomId + id}
                      className={makeClassName({
                        form__field: true,
                        "form__field--errors": !!typeErrors,
                      })}
                    >
                      <div className="form__label">Data type</div>

                      <select
                        className="form__control form__control--select"
                        id={definitionTypeInputDomId + id}
                        value={typeValue}
                        onChange={e => {
                          const node = e.currentTarget;
                          dispatch({
                            type: ActionType.FORM_CHANGED,
                            key: "def",
                            index,
                            value: node.value,
                            fieldName: "type",
                          });
                        }}
                      >
                        <option value="">Click to select</option>

                        {fieldTypeKeys.map(fieldType => {
                          return (
                            <option
                              key={fieldType}
                              value={fieldType}
                              id={makeDefinitionTypeOptionDomId(fieldType)}
                            >
                              {fieldType}
                            </option>
                          );
                        })}
                      </select>

                      {typeErrors && (
                        <FormCtrlError
                          id={definitionTypeInputDomId + id + "-errors"}
                        >
                          {typeErrors.map(([errorLabel, errorText], index) => {
                            return (
                              <div key={index}>
                                <span>{errorLabel} </span>
                                <span>{errorText}</span>
                              </div>
                            );
                          })}
                        </FormCtrlError>
                      )}
                    </label>

                    <div className="data-definition-controls">
                      <button
                        type="button"
                        className={`data-definition-control ${addDefinitionSelector}`}
                        onClick={() => {
                          dispatch({
                            type: ActionType.ADD_DEFINITION,
                          });
                        }}
                      >
                        +
                      </button>

                      {definitionsLen !== 1 && (
                        <button
                          type="button"
                          className={`data-definition-control ${removeDefinitionSelector}`}
                          onClick={() => {
                            dispatch({
                              type: ActionType.REMOVE_DEFINITION,
                              index,
                            });
                          }}
                        >
                          -
                        </button>
                      )}

                      {index !== 0 && (
                        <button
                          type="button"
                          className={`data-definition-control ${moveUpDefinitionSelector}`}
                          onClick={() => {
                            dispatch({
                              type: ActionType.UP_DEFINITION,
                              index,
                            });
                          }}
                        >
                          Up
                        </button>
                      )}

                      {definitionsLen > 1 && index + 1 !== definitionsLen && (
                        <button
                          type="button"
                          className={`data-definition-control ${moveDownDefinitionSelector}`}
                          onClick={() => {
                            dispatch({
                              type: ActionType.DOWN_DEFINITION,
                              index,
                            });
                          }}
                        >
                          Down
                        </button>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>

          <button type="submit" id={submitDomId} className="submit-btn">
            Create
          </button>

          <button
            id={resetDomId}
            type="button"
            className="submit-btn"
            onClick={() => {
              dispatch({
                type: ActionType.RESET_FORM_FIELDS,
              });
            }}
          >
            Reset
          </button>
        </form>
      </div>
    </div>
  );
}

function ErrorOrWarning({
  submissionState,
  dispatch,
  formValidity,
}: {
  submissionState: Submission;
  dispatch: DispatchType;
  formValidity: FormValidity;
}) {
  if (submissionState.value === StateValue.submitting) {
    return <Loading />;
  } else if (submissionState.value === StateValue.commonErrors) {
    return (
      <div className="notification notification--error">
        <div
          id={notificationErrorCloseId}
          className="notification__close"
          onClick={() => {
            dispatch({
              type: ActionType.CLOSE_SUBMIT_NOTIFICATION,
            });
          }}
        >
          <div className="notification__close-button notification__close-button--error" />
        </div>

        <div className="notification__content notification__content--error">
          {submissionState.commonErrors.context.errors}
        </div>
      </div>
    );
  } else if (submissionState.value === StateValue.warning) {
    return (
      <div className="notification notification--warning">
        <div
          id={notificationWarningCloseId}
          className="notification__close"
          onClick={() => {
            dispatch({
              type: ActionType.CLOSE_SUBMIT_NOTIFICATION,
            });
          }}
        >
          <button className="notification__close-button notification__close-button--warning" />
        </div>

        <div className="notification__content notification__content--warning">
          {submissionState.warning.context.warning}
        </div>
      </div>
    );
  } else if (formValidity.value === StateValue.invalid) {
    return (
      <div className="notification notification--error">
        <div
          id={notificationErrorCloseId}
          className="notification__close"
          onClick={() => {
            dispatch({
              type: ActionType.CLOSE_SUBMIT_NOTIFICATION,
            });
          }}
        >
          <div className="notification__close-button notification__close-button--error" />
        </div>

        <div className="notification__content notification__content--error">
          Errors while creating experience
        </div>
      </div>
    );
  } else {
    return null;
  }
}

// istanbul ignore next:
export default (props: CallerProps) => {
  const [createExperienceOffline] = useCreateExperienceOfflineMutation();
  const [createExperiences] = useCreateExperiencesMutation();
  const { client } = useContext(EbnisAppContext);

  return (
    <ExperienceDefinitionComponent
      client={client}
      createExperiences={createExperiences}
      createExperienceOffline={createExperienceOffline}
      {...props}
    />
  );
};
