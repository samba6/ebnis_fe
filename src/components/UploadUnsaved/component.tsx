import React, { useReducer, useEffect, useCallback } from "react";
import {
  Props,
  reducer,
  ActionType,
  fieldDefToUnsavedData,
  ExperiencesIdsToObjectMap,
  DispatchType,
  State,
  DidUploadSucceed,
  stateInitializerFn,
  ExperienceObjectMap,
} from "./utils";
import { Loading } from "../Loading";
import {
  UnsavedExperiencesData,
  SavedExperiencesWithUnsavedEntriesData,
} from "../../state/unsaved-resolvers";
import { SidebarHeader } from "../SidebarHeader";
import {
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges_node_fields,
} from "../../graphql/apollo-types/ExperienceFragment";
import "./styles.scss";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import makeClassNames from "classnames";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { CreateEntryInput } from "../../graphql/apollo-types/globalTypes";
import { UploadAllUnsavedsMutationFn } from "../../graphql/upload-unsaveds.mutation";
import { getConnStatus } from "../../state/get-conn-status";
import { NavigateFn } from "@reach/router";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import { UploadAllUnsavedsMutationVariables } from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { onUploadSuccessUpdate } from "./mutation-update";
import { Experience } from "../Experience/component";
import { UnsavedExperience } from "../ExperienceDefinition/resolver-utils";
import { scrollIntoView } from "../scroll-into-view";
import { FormCtrlError } from "../FormCtrlError/component";

const timeoutMs = 500;

export function UploadUnsaved(props: Props) {
  const {
    unSavedExperiencesProps: {
      loading: loadingUnsavedExperiences,
    } = {} as UnsavedExperiencesData,

    savedExperiencesWithUnsavedEntriesProps: {
      loading: loadingSavedExperiencesWithUnsavedEntries,
    } = {} as SavedExperiencesWithUnsavedEntriesData,

    uploadUnsavedExperiences,

    createEntries,

    uploadAllUnsaveds,
    navigate,
    client,
  } = props;

  const [state, dispatch] = useReducer(reducer, props, stateInitializerFn);

  const {
    tabs,
    uploading,
    serverError,
    allUploadSucceeded,
    unSavedCount,
    unsavedExperiencesLen,
    savedExperiencesLen,
    unsavedExperiences,
    savedExperiences,
    savedExperiencesIdsToObjectMap,
    unsavedExperiencesIdsToObjectMap,
    allUnsavedEntriesSucceeded,
    allUnsavedExperiencesSucceeded,
  } = state;

  const loading =
    loadingUnsavedExperiences || loadingSavedExperiencesWithUnsavedEntries;

  useEffect(() => {
    if (unSavedCount === 0) {
      (navigate as NavigateFn)("/404");
      return;
    }

    getConnStatus(client).then(isConnected => {
      if (!isConnected) {
        (navigate as NavigateFn)("/404");
        return;
      }
    });
  }, [unSavedCount, navigate, client]);

  const onUploadAllClicked = useCallback(
    async function onUploadAllClickedFn() {
      dispatch({
        type: ActionType.setUploading,
        payload: true,
      });

      try {
        let uploadFunction;
        let variables;

        if (unsavedExperiencesLen !== 0 && savedExperiencesLen !== 0) {
          uploadFunction = uploadAllUnsaveds;

          variables = {
            unsavedExperiences: unsavedExperiencesToUploadData(
              unsavedExperiencesIdsToObjectMap,
            ),

            unsavedEntries: savedExperiencesToUploadData(
              savedExperiencesIdsToObjectMap,
            ),
          };
        } else if (unsavedExperiencesLen !== 0) {
          uploadFunction = uploadUnsavedExperiences;

          variables = ({
            input: unsavedExperiencesToUploadData(
              unsavedExperiencesIdsToObjectMap,
            ),
          } as unknown) as UploadAllUnsavedsMutationVariables;
        } else {
          uploadFunction = createEntries;

          variables = ({
            createEntries: savedExperiencesToUploadData(
              savedExperiencesIdsToObjectMap,
            ),
          } as unknown) as UploadAllUnsavedsMutationVariables;
        }

        const result = await (uploadFunction as UploadAllUnsavedsMutationFn)({
          variables,

          update: onUploadSuccessUpdate({
            savedExperiencesIdsToUnsavedEntriesMap: savedExperiencesIdsToObjectMap,
            unsavedExperiences: (unsavedExperiences as unknown) as UnsavedExperience[],
          }),
        });

        dispatch({
          type: ActionType.uploadResult,
          payload: result && result.data,
        });
      } catch (error) {
        dispatch({
          type: ActionType.setServerError,
          payload: error,
        });

        scrollIntoView("js-scroll-into-view-server-error");
      }
    },
    [
      dispatch,
      unsavedExperiencesLen,
      savedExperiencesLen,
      uploadAllUnsaveds,
      unsavedExperiencesIdsToObjectMap,
      savedExperiencesIdsToObjectMap,
      uploadUnsavedExperiences,
      createEntries,
      unsavedExperiences,
    ],
  );

  if (loading && unSavedCount === 0) {
    return <Loading />;
  }

  return (
    <div className="components-upload-unsaved">
      <ModalComponent open={uploading} />

      <SidebarHeader sidebar={true}>
        <div className="components-upload-unsaved-header">
          <span>Unsaved Preview</span>

          <UploadAllButtonComponent
            onUploadAllClicked={onUploadAllClicked}
            allUploadSucceeded={allUploadSucceeded}
          />
        </div>
      </SidebarHeader>

      <div className="main">
        <TabsMenuComponent state={state} dispatch={dispatch} />

        <ServerError dispatch={dispatch} serverError={serverError} />

        <TransitionGroup className="all-unsaveds">
          {tabs["1"] && (
            <CSSTransition
              timeout={timeoutMs}
              key="saved-experiences"
              classNames="pane-animation-left"
            >
              <div
                className={makeClassNames({ tab: true, active: tabs["1"] })}
                data-testid="saved-experiences"
              >
                {savedExperiences.map(experience => {
                  return (
                    <ExperienceComponent
                      key={experience.id}
                      type="saved"
                      experienceObjectMap={
                        savedExperiencesIdsToObjectMap[experience.id]
                      }
                      allUploadSucceeded={allUnsavedEntriesSucceeded}
                    />
                  );
                })}
              </div>
            </CSSTransition>
          )}

          {tabs["2"] && (
            <CSSTransition
              timeout={timeoutMs}
              key="unsaved-experiences"
              classNames="pane-animation-right"
            >
              <div
                className={makeClassNames({ tab: true, active: tabs["2"] })}
                data-testid="unsaved-experiences"
              >
                {unsavedExperiences.map(experience => {
                  return (
                    <ExperienceComponent
                      key={experience.id}
                      type="unsaved"
                      experienceObjectMap={
                        unsavedExperiencesIdsToObjectMap[experience.id]
                      }
                      allUploadSucceeded={allUnsavedExperiencesSucceeded}
                    />
                  );
                })}
              </div>
            </CSSTransition>
          )}
        </TransitionGroup>
      </div>
    </div>
  );
}

////////////////////////// COMPONENTS ///////////////////////////////////

function ExperienceComponent({
  type,
  allUploadSucceeded,
  experienceObjectMap,
}: {
  experienceObjectMap: ExperienceObjectMap;
  type: "unsaved" | "saved";
  allUploadSucceeded?: boolean;
}) {
  const {
    experience,
    didUploadSucceed,
    unsavedEntries,
    entriesErrors,
    experienceError,
  } = experienceObjectMap;

  const hasError = entriesErrors || experienceError;

  const experienceId = experience.id;

  let titleClassSuffix = "";

  if (allUploadSucceeded) {
    titleClassSuffix = "--success";
  }

  if (hasError) {
    titleClassSuffix = "--error";
  }

  let errorIcon = null;

  if (didUploadSucceed) {
    errorIcon = (
      <Icon
        name="check"
        data-testid={"upload-triggered-icon-success-" + experienceId}
        className="experience-title__success-icon upload-success-icon upload-result-icon"
      />
    );
  } else if (hasError) {
    errorIcon = (
      <Icon
        name="ban"
        data-testid={"upload-triggered-icon-error-" + experienceId}
        className="experience-title__error-icon upload-error-icon upload-result-icon"
      />
    );
  }

  return (
    <Experience
      experience={experience}
      data-testid={type + "-experience"}
      headerProps={{
        "data-testid": type + "-experience-title-" + experienceId,
        className: `experience-title--uploads experience-title${titleClassSuffix}`,

        children: errorIcon,
      }}
      entryProps={{
        "data-testid": `${type}-experience-${experienceId}-entry-`,
      }}
      entryNodes={unsavedEntries}
      menuOptions={{
        newEntry: false,
      }}
      doNotShowNoEntriesLink={unsavedEntries.length === 0}
    >
      {experienceError && (
        <FormCtrlError
          className="experience-error"
          data-testid={`unsaved-experience-errors-${experienceId}`}
        >
          <div>Error while saving experience ::</div>
          <div>{experienceError}</div>
        </FormCtrlError>
      )}
    </Experience>
  );
}

function ModalComponent({ open }: { open?: boolean }) {
  return (
    <Modal
      data-testid="uploading-data"
      basic={true}
      size="small"
      open={open}
      dimmer="inverted"
    >
      <Modal.Content>
        <Loading />
      </Modal.Content>
    </Modal>
  );
}

function TabsMenuComponent({
  dispatch,
  state,
}: {
  dispatch: DispatchType;
  state: State;
}) {
  const {
    isUploadTriggered,
    hasUnsavedExperiencesUploadError,
    hasSavedExperiencesUploadError,
    tabs,
    unsavedExperiencesLen,
    uploadResult,
    savedExperiencesLen,
  } = state;

  const toggleTab1 = useCallback(
    function toggleTab1Fn() {
      dispatch({
        type: ActionType.toggleTab,
        payload: 1,
      });
    },
    [dispatch],
  );

  const toggleTab2 = useCallback(
    function toggleTab2Fn() {
      dispatch({
        type: ActionType.toggleTab,
        payload: 2,
      });
    },
    [dispatch],
  );

  let unsavedIcon = null;
  let savedIcon = null;

  if (isUploadTriggered) {
    savedIcon =
      savedExperiencesLen === 0 ? null : hasSavedExperiencesUploadError ? (
        <Icon
          name="ban"
          data-testid="upload-triggered-icon-error-saved-experiences"
          className="upload-error-icon upload-result-icon"
        />
      ) : (
        <Icon
          name="check"
          data-testid="upload-triggered-icon-success-saved-experiences"
          className="upload-success-icon upload-result-icon"
        />
      );

    unsavedIcon =
      unsavedExperiencesLen === 0 ? null : hasUnsavedExperiencesUploadError ? (
        <Icon
          name="ban"
          data-testid="upload-triggered-icon-error-unsaved-experiences"
          className="upload-error-icon upload-result-icon"
        />
      ) : (
        <Icon
          name="check"
          data-testid="upload-triggered-icon-success-unsaved-experiences"
          className="upload-success-icon upload-result-icon"
        />
      );
  }

  return (
    <div
      className={makeClassNames({
        "ui item menu": true,
        one: savedExperiencesLen === 0 || unsavedExperiencesLen === 0,
        two: savedExperiencesLen !== 0 && unsavedExperiencesLen !== 0,
      })}
      data-testid="tabs-menu"
    >
      {(savedExperiencesLen !== 0 ||
        (uploadResult && uploadResult.createEntries)) && (
        <a
          className={setTabMenuClassNames("1", tabs)}
          data-testid="saved-experiences-menu"
          onClick={toggleTab1}
        >
          Entries
          {savedIcon}
        </a>
      )}

      {(unsavedExperiencesLen !== 0 ||
        (uploadResult && uploadResult.saveOfflineExperiences)) && (
        <a
          className={setTabMenuClassNames("2", tabs)}
          data-testid="unsaved-experiences-menu"
          onClick={toggleTab2}
        >
          Experiences
          {unsavedIcon}
        </a>
      )}
    </div>
  );
}

function UploadAllButtonComponent({
  onUploadAllClicked,
  allUploadSucceeded,
}: DidUploadSucceed & {
  onUploadAllClicked: () => Promise<void>;
}) {
  if (allUploadSucceeded) {
    return null;
  }

  return (
    <Button
      className="upload-button"
      data-testid="upload-all"
      onClick={onUploadAllClicked}
    >
      UPLOAD
    </Button>
  );
}

function ServerError(props: {
  dispatch: DispatchType;
  serverError: State["serverError"];
}) {
  const { serverError, dispatch } = props;

  if (!serverError) {
    return null;
  }

  return (
    <Message
      style={{
        minHeight: "auto",
        position: "relative",
        marginTop: 0,
        marginLeft: "20px",
        marginRight: "20px",
      }}
      data-testid="server-error"
      error={true}
      onDismiss={function onDismiss() {
        dispatch({
          type: ActionType.removeServerErrors,
          payload: null,
        });
      }}
    >
      <Message.Content>
        <span
          style={{
            position: "absolute",
            top: "-60px",
          }}
          id="js-scroll-into-view-server-error"
        />

        {serverError}
      </Message.Content>
    </Message>
  );
}

////////////////////////// END COMPONENTS ///////////////////////////////////

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

function toUploadableEntry(entry: ExperienceFragment_entries_edges_node) {
  const fields = entry.fields.map(value => {
    const field = value as ExperienceFragment_entries_edges_node_fields;

    return {
      data: field.data,
      defId: field.defId,
    };
  });

  return {
    expId: entry.expId,
    clientId: entry.clientId,
    fields,
    insertedAt: entry.insertedAt,
    updatedAt: entry.updatedAt,
  };
}

function unsavedExperiencesToUploadData(
  experiencesIdsToObjectMap: ExperiencesIdsToObjectMap,
) {
  return Object.values(experiencesIdsToObjectMap).map(
    ({ experience, unsavedEntries }) => {
      return {
        entries: unsavedEntries.map(toUploadableEntry),
        title: experience.title,
        clientId: experience.clientId,
        fieldDefs: experience.fieldDefs.map(fieldDefToUnsavedData),
        insertedAt: experience.insertedAt,
        updatedAt: experience.updatedAt,
        description: experience.description,
      };
    },
  );
}

function savedExperiencesToUploadData(
  experiencesIdsToObjectMap: ExperiencesIdsToObjectMap,
) {
  return Object.entries(experiencesIdsToObjectMap).reduce(
    (acc, [, { unsavedEntries }]) => {
      return acc.concat(unsavedEntries.map(toUploadableEntry));
    },
    [] as CreateEntryInput[],
  );
}

function setTabMenuClassNames(tabNumber: string | number, tabs: State["tabs"]) {
  return makeClassNames({
    item: true,
    active: tabs[tabNumber],
    "tab-menu": true,
  });
}

////////////////////////// END HELPER FUNCTIONS //////////////////////////////

////////////////////////// TYPES ///////////////////////////////////
