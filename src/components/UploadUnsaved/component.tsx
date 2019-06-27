import React, { useReducer, useEffect } from "react";
import {
  Props,
  reducer,
  ActionType,
  fieldDefToUnsavedData,
  ExperiencesIdsToObjectMap,
  DispatchType,
  State,
  DidUploadSucceed,
  stateInitializerFn
} from "./utils";
import { Loading } from "../Loading";
import {
  UnsavedExperiencesData,
  SavedExperiencesWithUnsavedEntriesData
} from "../../state/unsaved-resolvers";
import { SidebarHeader } from "../SidebarHeader";
import {
  ExperienceFragment,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges_node_fields
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
import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutationVariables
} from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { onUploadSuccessUpdate } from "./mutation-update";
import { Experience } from "../Experience/component";
import { UnsavedExperience } from "../ExperienceDefinition/resolver-utils";

const timeoutMs = 500;

export function UploadUnsaved(props: Props) {
  const {
    unSavedExperiencesProps: {
      loading: loadingUnsavedExperiences
    } = {} as UnsavedExperiencesData,

    savedExperiencesWithUnsavedEntriesProps: {
      loading: loadingSavedExperiencesWithUnsavedEntries
    } = {} as SavedExperiencesWithUnsavedEntriesData,

    uploadUnsavedExperiences,

    createEntries,

    uploadAllUnsaveds,
    navigate,
    client
  } = props;

  const [state, dispatch] = useReducer(reducer, props, stateInitializerFn);

  const {
    tabs,
    uploading,
    uploadResult,
    serverError,
    isUploadTriggered,
    allUploadSucceeded,
    hasUnsavedExperiencesUploadError,
    hasSavedExperiencesUploadError,
    unSavedCount,
    unsavedExperiencesLen,
    savedExperiencesLen,
    unsavedExperiences,
    savedExperiences,
    savedExperiencesIdsToObjectMap,
    unsavedExperiencesIdsToObjectMap
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
  }, []);

  async function onUploadAllClicked() {
    dispatch({
      type: ActionType.setUploading,
      payload: true
    });

    try {
      let uploadFunction;
      let uploadFunctionVariables;

      if (unsavedExperiencesLen !== 0 && savedExperiencesLen !== 0) {
        uploadFunction = uploadAllUnsaveds;

        uploadFunctionVariables = {
          unsavedExperiences: unsavedExperiencesToUploadData(
            unsavedExperiencesIdsToObjectMap
          ),

          unsavedEntries: savedExperiencesWithUnsavedEntriesToUploadData(
            savedExperiencesIdsToObjectMap
          )
        };
      } else if (unsavedExperiencesLen !== 0) {
        uploadFunction = uploadUnsavedExperiences;

        uploadFunctionVariables = ({
          input: unsavedExperiencesToUploadData(
            unsavedExperiencesIdsToObjectMap
          )
        } as unknown) as UploadAllUnsavedsMutationVariables;
      } else {
        uploadFunction = createEntries;

        uploadFunctionVariables = ({
          createEntries: savedExperiencesWithUnsavedEntriesToUploadData(
            savedExperiencesIdsToObjectMap
          )
        } as unknown) as UploadAllUnsavedsMutationVariables;
      }

      const result = await (uploadFunction as UploadAllUnsavedsMutationFn)({
        variables: uploadFunctionVariables,
        update: onUploadSuccessUpdate({
          savedExperiencesIdsToUnsavedEntriesMap: savedExperiencesIdsToObjectMap,
          unsavedExperiences: (unsavedExperiences as unknown) as UnsavedExperience[]
        })
      });

      dispatch({
        type: ActionType.uploadResult,
        payload: result && result.data
      });
    } catch (error) {
      dispatch({
        type: ActionType.setServerError,
        payload: error
      });
    }
  }

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
        {serverError && <div data-testid="server-error">{serverError}</div>}

        <TabsMenuComponent
          savedExperiencesLen={savedExperiencesLen}
          unsavedExperiencesLen={unsavedExperiencesLen}
          uploadResult={uploadResult}
          tabs={tabs}
          dispatch={dispatch}
          isUploadTriggered={isUploadTriggered}
          hasUnsavedExperiencesUploadError={hasUnsavedExperiencesUploadError}
          hasSavedExperiencesUploadError={hasSavedExperiencesUploadError}
        />

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
                      experience={experience}
                      type="saved"
                      state={state}
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
                  const { id } = experience;

                  return (
                    <ExperienceComponent
                      key={id}
                      experience={experience}
                      type="unsaved"
                      state={state}
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
  experience,
  type,
  state
}: {
  experience: ExperienceFragment;
  type: "unsaved" | "saved";
  state: State;
}) {
  const {
    savedExperiencesIdsToObjectMap,
    unsavedExperiencesIdsToObjectMap,
    allUploadSucceeded,
    hasSavedExperiencesUploadError,
    hasUnsavedExperiencesUploadError
  } = state;

  const experienceId = experience.id;

  let titleClassSuffix = "";

  if (hasSavedExperiencesUploadError || hasUnsavedExperiencesUploadError) {
    titleClassSuffix = "--error";
  }

  if (allUploadSucceeded) {
    titleClassSuffix = "--success";
  }

  const map =
    type === "unsaved"
      ? unsavedExperiencesIdsToObjectMap
      : savedExperiencesIdsToObjectMap;

  const mapObject = map[experienceId];

  let check = null;

  if (mapObject.didUploadSucceed) {
    check = (
      <Icon
        name="check"
        data-testid={"upload-triggered-icon-success-" + experienceId}
        className="experience-title__success-icon upload-success-icon upload-result-icon"
      />
    );
  } else if (mapObject.hasUploadError) {
    check = (
      <Icon
        name="check"
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
        "data-testid": "experience-title",
        className: `experience-title--uploads experience-title${titleClassSuffix}`,

        children: check
      }}
      entryProps={{
        "data-testid": `${type}-experience-${experienceId}-entry-`
      }}
      entryNodes={mapObject.unsavedEntries}
      menuOptions={{
        newEntry: false
      }}
    />
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
  savedExperiencesLen: savedExperiencesWithUnsavedEntriesLen,
  unsavedExperiencesLen,
  uploadResult,
  tabs,
  dispatch,
  isUploadTriggered,
  hasUnsavedExperiencesUploadError,
  hasSavedExperiencesUploadError
}: DidUploadSucceed & {
  savedExperiencesLen: number;
  unsavedExperiencesLen: number;
  uploadResult?: UploadAllUnsavedsMutation;
  tabs: State["tabs"];
  dispatch: DispatchType;
  isUploadTriggered?: boolean;
}) {
  return (
    <div
      className={makeClassNames({
        "ui item menu": true,
        one: !tabs["1"] || !tabs["2"],
        two: tabs["1"] && tabs["2"]
      })}
    >
      {(savedExperiencesWithUnsavedEntriesLen !== 0 ||
        (uploadResult && uploadResult.createEntries)) && (
        <a
          className={setTabMenuClassNames("1", tabs)}
          data-testid="saved-experiences-menu"
          onClick={() => {
            dispatch({
              type: ActionType.toggleTab,
              payload: 1
            });
          }}
        >
          Entries
          {isUploadTriggered &&
            (hasSavedExperiencesUploadError ? (
              <Icon
                name="ban"
                data-testid="upload-triggered-icon-error-saved-experiences"
                className="upload-error-icon upload-result-icon"
              />
            ) : (
              <Icon
                name="check"
                data-testid="upload-triggered-icon-success-saved-experiences"
                className="upload-error-icon upload-result-icon"
              />
            ))}
        </a>
      )}

      {(unsavedExperiencesLen !== 0 ||
        (uploadResult && uploadResult.saveOfflineExperiences)) && (
        <a
          className={setTabMenuClassNames("2", tabs)}
          data-testid="unsaved-experiences-menu"
          onClick={() => {
            dispatch({
              type: ActionType.toggleTab,
              payload: 2
            });
          }}
        >
          Experiences
          {isUploadTriggered &&
            (hasUnsavedExperiencesUploadError ? (
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
            ))}
        </a>
      )}
    </div>
  );
}

function UploadAllButtonComponent({
  onUploadAllClicked,
  allUploadSucceeded
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

////////////////////////// END COMPONENTS ///////////////////////////////////

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

function toUploadableEntry(entry: ExperienceFragment_entries_edges_node) {
  const fields = entry.fields.map(value => {
    const field = value as ExperienceFragment_entries_edges_node_fields;

    return {
      data: field.data,
      defId: field.defId
    };
  });

  return {
    expId: entry.expId,
    clientId: entry.clientId,
    fields,
    insertedAt: entry.insertedAt,
    updatedAt: entry.updatedAt
  };
}

function unsavedExperiencesToUploadData(
  experiencesIdsToObjectMap: ExperiencesIdsToObjectMap
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
        description: experience.description
      };
    }
  );
}

function savedExperiencesWithUnsavedEntriesToUploadData(
  experiencesIdsToObjectMap: ExperiencesIdsToObjectMap
) {
  return Object.entries(experiencesIdsToObjectMap).reduce(
    (acc, [id, { unsavedEntries }]) => {
      return acc.concat(unsavedEntries.map(toUploadableEntry));
    },
    [] as CreateEntryInput[]
  );
}

function setTabMenuClassNames(tabNumber: string | number, tabs: State["tabs"]) {
  return makeClassNames({
    item: true,
    active: tabs[tabNumber],
    "tab-menu": true
  });
}

////////////////////////// END HELPER FUNCTIONS //////////////////////////////

////////////////////////// TYPES ///////////////////////////////////
