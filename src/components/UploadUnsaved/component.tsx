import React, { useReducer, useMemo, useEffect } from "react";
import {
  Props,
  reducer,
  ActionType,
  fieldDefToUnsavedData,
  ExperiencesIdsToUnsavedEntriesMap
} from "./utils";
import { Loading } from "../Loading";
import {
  UnsavedExperiencesData,
  SavedExperiencesWithUnsavedEntriesData,
  entryNodesFromExperience
} from "../../state/unsaved-resolvers";
import { SidebarHeader } from "../SidebarHeader";
import {
  ExperienceFragment,
  ExperienceFragment_fieldDefs,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges_node_fields
} from "../../graphql/apollo-types/ExperienceFragment";
import { isUnsavedId } from "../../constants";
import { Entry } from "../Entry/component";
import "./styles.scss";
import { UnsavedExperience } from "../ExperienceNewEntryParent/resolvers";
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

const timeoutMs = 500;

export function UploadUnsaved(props: Props) {
  const {
    unSavedExperiencesProps: {
      loading: loadingUnsavedExperiences,
      unsavedExperiences = []
    } = {} as UnsavedExperiencesData,

    savedExperiencesWithUnsavedEntriesProps: {
      loading: loadingSavedExperiencesWithUnsavedEntries,
      savedExperiencesWithUnsavedEntries = []
    } = {} as SavedExperiencesWithUnsavedEntriesData,

    uploadUnsavedExperiences,

    createEntries,

    uploadAllUnsaveds,
    navigate,
    client
  } = props;

  const savedExperiencesWithUnsavedEntriesLen =
    savedExperiencesWithUnsavedEntries.length;

  const unsavedExperiencesLen = unsavedExperiences.length;

  const [state, dispatch] = useReducer(reducer, {
    tabs: {
      1: savedExperiencesWithUnsavedEntriesLen !== 0,
      2:
        savedExperiencesWithUnsavedEntriesLen === 0 &&
        unsavedExperiencesLen !== 0
    }
  });

  const { tabs, uploading, uploadResult, serverError } = state;

  const unSavedCount =
    savedExperiencesWithUnsavedEntriesLen + unsavedExperiencesLen;

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
  }, [unSavedCount]);

  const savedExperiencesIdToUnsavedEntriesMap = useMemo(() => {
    let experienceIdToUnsavedEntriesMap = {} as ExperiencesIdsToUnsavedEntriesMap;

    if (savedExperiencesWithUnsavedEntriesLen !== 0) {
      experienceIdToUnsavedEntriesMap = savedExperiencesWithUnsavedEntries.reduce(
        (acc, experience) => {
          const unsavedEntries = entryNodesFromExperience(experience).reduce(
            (entriesAcc, entry) => {
              if (isUnsavedId(entry.id)) {
                entriesAcc.push(entry);
              }

              return entriesAcc;
            },

            [] as ExperienceFragment_entries_edges_node[]
          );

          acc[experience.id] = {
            unsavedEntries,
            experience
          };

          return acc;
        },
        experienceIdToUnsavedEntriesMap
      );
    }

    return experienceIdToUnsavedEntriesMap;
  }, [savedExperiencesWithUnsavedEntries]);

  const unsavedExperiencesEntriesOnly = useMemo(() => {
    let unsavedEntries = {} as {
      [k: string]: ExperienceFragment_entries_edges_node[];
    };

    if (unsavedExperiencesLen !== 0) {
      unsavedEntries = unsavedExperiences.reduce((acc, experience) => {
        const entries = entryNodesFromExperience(
          (experience as unknown) as ExperienceFragment
        );

        acc[experience.id] = entries;

        return acc;
      }, unsavedEntries);
    }

    return unsavedEntries;
  }, [unsavedExperiences]);

  const uploadResultSummary = useMemo(() => {
    let things = {} as UploadResultSummary;

    if (!uploadResult) {
      return things;
    }

    things = {
      unsavedExperiencesSucceeded: didAllUploadUnsavedExperiencesSucceed(
        uploadResult
      ),

      unsavedEntriesSucceeded: didAllUploadSavedExperiencesEntriesSucceed(
        uploadResult
      )
    };

    return things;
  }, [uploadResult]);

  async function onUploadAllClicked() {
    dispatch({
      type: ActionType.setUploading,
      payload: true
    });

    try {
      // let result = {} as UploadAllUnsavedsMutationFnResult;
      let uploadFunction;
      let uploadFunctionVariables;

      if (
        unsavedExperiencesLen !== 0 &&
        savedExperiencesWithUnsavedEntriesLen !== 0
      ) {
        uploadFunction = uploadAllUnsaveds;

        uploadFunctionVariables = {
          unsavedExperiences: unsavedExperiencesToUploadData(
            unsavedExperiences,
            unsavedExperiencesEntriesOnly
          ),

          unsavedEntries: savedExperiencesWithUnsavedEntriesToUploadData(
            savedExperiencesWithUnsavedEntries,
            savedExperiencesIdToUnsavedEntriesMap
          )
        };
      } else if (unsavedExperiencesLen !== 0) {
        uploadFunction = uploadUnsavedExperiences;

        uploadFunctionVariables = ({
          input: unsavedExperiencesToUploadData(
            unsavedExperiences,
            unsavedExperiencesEntriesOnly
          )
        } as unknown) as UploadAllUnsavedsMutationVariables;
      } else {
        uploadFunction = createEntries;

        uploadFunctionVariables = ({
          createEntries: savedExperiencesWithUnsavedEntriesToUploadData(
            savedExperiencesWithUnsavedEntries,
            savedExperiencesIdToUnsavedEntriesMap
          )
        } as unknown) as UploadAllUnsavedsMutationVariables;
      }

      const result = await (uploadFunction as UploadAllUnsavedsMutationFn)({
        variables: uploadFunctionVariables,
        update: onUploadSuccessUpdate(savedExperiencesIdToUnsavedEntriesMap)
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

          {!uploadResult && (
            <Button
              className="upload-button"
              data-testid="upload-all"
              onClick={onUploadAllClicked}
            >
              UPLOAD
            </Button>
          )}
        </div>
      </SidebarHeader>

      <div className="main">
        {serverError && <div data-testid="server-error">{serverError}</div>}

        <div className="ui two item menu">
          {savedExperiencesWithUnsavedEntriesLen !== 0 && (
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
              {uploadResult &&
                (uploadResultSummary.unsavedEntriesSucceeded ? (
                  <Icon
                    name="check"
                    data-testid="unsaved-entries-upload-success-icon"
                    className="upload-success-icon upload-result-icon"
                  />
                ) : (
                  <Icon
                    name="ban"
                    data-testid="unsaved-entries-upload-error-icon"
                    className="upload-error-icon upload-result-icon"
                  />
                ))}
            </a>
          )}

          {unsavedExperiencesLen !== 0 && (
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
              {uploadResult &&
                (uploadResultSummary.unsavedExperiencesSucceeded ? (
                  <Icon
                    name="check"
                    data-testid="unsaved-experiences-upload-success-icon"
                    className="upload-success-icon upload-result-icon"
                  />
                ) : (
                  <Icon
                    name="ban"
                    data-testid="unsaved-experiences-upload-error-icon"
                    className="upload-error-icon upload-result-icon"
                  />
                ))}
            </a>
          )}
        </div>

        <TransitionGroup className="all-unsaveds">
          {savedExperiencesWithUnsavedEntriesLen !== 0 && tabs["1"] && (
            <CSSTransition
              timeout={timeoutMs}
              key="saved-experiences"
              classNames="pane-animation-left"
            >
              <div
                className={makeClassNames({ tab: true, active: tabs["1"] })}
                data-testid="saved-experiences"
              >
                {savedExperiencesWithUnsavedEntries.map(experience => {
                  return (
                    <ExperienceComponent
                      key={experience.id}
                      experience={experience}
                      entries={
                        savedExperiencesIdToUnsavedEntriesMap[experience.id]
                          .unsavedEntries
                      }
                      type="saved"
                      uploadResultSummary={uploadResultSummary}
                    />
                  );
                })}
              </div>
            </CSSTransition>
          )}

          {unsavedExperiencesLen !== 0 && tabs["2"] && (
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
                      experience={(experience as unknown) as ExperienceFragment}
                      entries={unsavedExperiencesEntriesOnly[experience.id]}
                      type="unsaved"
                      uploadResultSummary={uploadResultSummary}
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

function ExperienceComponent({
  experience,
  entries,
  type,
  uploadResultSummary
}: {
  experience: ExperienceFragment;
  entries: ExperienceFragment_entries_edges_node[];
  type: "unsaved" | "saved";
  uploadResultSummary: UploadResultSummary;
}) {
  const experienceId = experience.id;
  const entriesLen = entries.length;

  const success =
    uploadResultSummary.unsavedEntriesSucceeded === true ||
    uploadResultSummary.unsavedExperiencesSucceeded === true;

  let titleClassSuffix = "";

  if (
    uploadResultSummary.unsavedEntriesSucceeded === false ||
    uploadResultSummary.unsavedExperiencesSucceeded === false
  ) {
    titleClassSuffix = "--error";
  }

  if (success) {
    titleClassSuffix = "--success";
  }

  return (
    <div data-testid={type + "-experience"} className="experience">
      <div
        className={`experience-title${titleClassSuffix}`}
        data-testid="experience-title"
      >
        {success && (
          <Button
            className="experience-title__remove-btn"
            data-testid="experience-success-remove-btn"
            type="button"
            basic={true}
          >
            Remove
          </Button>
        )}

        <div className="experience-title__title">{experience.title}</div>
      </div>

      {entries.map((entry, index) => {
        return (
          <Entry
            data-testid={`${type}-experience-${experienceId}-entry-${entry.id}`}
            key={entry.id}
            entry={entry}
            fieldDefs={experience.fieldDefs as ExperienceFragment_fieldDefs[]}
            entriesLen={entriesLen}
            index={index}
            className={makeClassNames({
              "unsaved-entry-first": index === 0,
              "unsaved-entry": true
            })}
          />
        );
      })}
    </div>
  );
}

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
  unsavedExperiences: UnsavedExperience[],
  unsavedExperiencesEntriesOnly: {
    [k: string]: ExperienceFragment_entries_edges_node[];
  }
) {
  return unsavedExperiences.map(experience => {
    const entries = unsavedExperiencesEntriesOnly[experience.id].map(
      toUploadableEntry
    );

    return {
      entries,
      title: experience.title,
      clientId: experience.clientId,
      fieldDefs: experience.fieldDefs.map(fieldDefToUnsavedData),
      insertedAt: experience.insertedAt,
      updatedAt: experience.updatedAt,
      description: experience.description
    };
  });
}

function savedExperiencesWithUnsavedEntriesToUploadData(
  savedExperiencesWithUnsavedEntries: ExperienceFragment[],
  savedExperiencesWithUnsavedEntriesOnly: ExperiencesIdsToUnsavedEntriesMap
) {
  return savedExperiencesWithUnsavedEntries.reduce(
    (acc, experience) => {
      const entries = savedExperiencesWithUnsavedEntriesOnly[
        experience.id
      ].unsavedEntries.map(toUploadableEntry);

      return acc.concat(entries);
    },
    [] as CreateEntryInput[]
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

function setTabMenuClassNames(
  tabNumber: string | number,
  tabs: { [k: number]: boolean }
) {
  return makeClassNames({
    item: true,
    active: tabs[tabNumber],
    "tab-menu": true
  });
}

function didAllUploadUnsavedExperiencesSucceed(
  uploadResult: UploadAllUnsavedsMutation
) {
  if (!uploadResult.syncOfflineExperiences) {
    return false;
  }

  const result = uploadResult.syncOfflineExperiences.reduce((acc, elm) => {
    if (!elm || !elm.experience || elm.entriesErrors) {
      return false;
    }

    return acc;
  }, true);

  return result;
}

function didAllUploadSavedExperiencesEntriesSucceed(
  uploadResult: UploadAllUnsavedsMutation
) {
  const { createEntries } = uploadResult;

  if (!createEntries) {
    return true;
  }

  const result = createEntries.reduce((acc, elm) => {
    if (!elm || elm.errors) {
      return false;
    }

    return acc;
  }, true);

  return result;
}

interface UploadResultSummary {
  unsavedExperiencesSucceeded?: boolean;
  unsavedEntriesSucceeded?: boolean;
}
