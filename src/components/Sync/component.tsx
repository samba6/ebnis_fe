import React, { useReducer, useMemo, useEffect } from "react";
import { Props, reducer, ActionType, fieldDefToUnsavedData } from "./utils";
import { Loading } from "../Loading";
import {
  UnsavedExperiencesData,
  SavedExperiencesUnsavedEntriesData,
  entryNodesFromExperience
} from "../../state/sync-unsaved-resolver";
import { SidebarHeader } from "../SidebarHeader";
import {
  ExperienceFragment,
  ExperienceFragment_fieldDefs,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges_node_fields
} from "../../graphql/apollo-types/ExperienceFragment";
import { isUnsavedId } from "../../constants";
import { Entry } from "../Experience/entry";
import "./styles.scss";
import { UnsavedExperience } from "../ExperienceNewEntryParent/resolvers";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import setClassNames from "classnames";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { CreateEntry } from "../../graphql/apollo-types/globalTypes";
import { UploadAllUnsavedsMutationFnResult } from "../../graphql/upload-unsaveds.mutation";
import { getConnStatus } from "../../state/get-conn-status";
import { NavigateFn } from "@reach/router";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import { UploadAllUnsavedsMutation } from "../../graphql/apollo-types/UploadAllUnsavedsMutation";

const timeout = 500;

interface ExperienceIdToUnsavedEntriesMap {
  [k: string]: ExperienceFragment_entries_edges_node[];
}

export function Sync(props: Props) {
  const {
    unSavedExperiencesProps: {
      loading: loadingUnsavedExperiences,
      unsavedExperiences = []
    } = {} as UnsavedExperiencesData,

    savedExperiencesUnSavedEntriesProps: {
      loading: loadingSavedExperiencesUnsavedEntries,
      savedExperiencesUnsavedEntries = []
    } = {} as SavedExperiencesUnsavedEntriesData,

    uploadUnsavedExperiences,

    createEntries,

    uploadAllUnsaveds,
    navigate,
    client
  } = props;

  useEffect(() => {
    getConnStatus(client).then(isConnected => {
      if (!isConnected) {
        (navigate as NavigateFn)("/404");
      }
    });
  }, []);

  const savedExperiencesUnsavedEntriesLen =
    savedExperiencesUnsavedEntries.length;

  const unsavedExperiencesLen = unsavedExperiences.length;

  const [state, dispatch] = useReducer(reducer, {
    tabs: {
      1: savedExperiencesUnsavedEntriesLen !== 0,
      2: savedExperiencesUnsavedEntriesLen === 0 && unsavedExperiencesLen !== 0
    }
  });

  const { tabs, uploading, uploadResult } = state;

  const unSavedCount =
    savedExperiencesUnsavedEntriesLen + unsavedExperiencesLen;

  const loading =
    loadingUnsavedExperiences || loadingSavedExperiencesUnsavedEntries;

  const savedExperiencesUnsavedEntriesOnly = useMemo(() => {
    let experienceIdToUnsavedEntriesMap = {} as ExperienceIdToUnsavedEntriesMap;

    if (savedExperiencesUnsavedEntriesLen !== 0) {
      experienceIdToUnsavedEntriesMap = savedExperiencesUnsavedEntries.reduce(
        (acc, experience) => {
          acc[experience.id] = entryNodesFromExperience(experience).reduce(
            (entriesAcc, entry) => {
              if (isUnsavedId(entry.id)) {
                entriesAcc.push(entry);
              }

              return entriesAcc;
            },

            [] as ExperienceFragment_entries_edges_node[]
          );

          return acc;
        },
        experienceIdToUnsavedEntriesMap
      );
    }

    return experienceIdToUnsavedEntriesMap;
  }, [savedExperiencesUnsavedEntries]);

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

  if (loading && unSavedCount === 0) {
    return <Loading />;
  }

  if (unSavedCount === 0) {
    return <div data-testid="no-unsaved">There are no unsaved data</div>;
  }

  async function onUploadAllClicked() {
    dispatch({
      type: ActionType.setUploading,
      payload: true
    });

    try {
      let result = {} as UploadAllUnsavedsMutationFnResult;

      if (
        unsavedExperiencesLen !== 0 &&
        savedExperiencesUnsavedEntriesLen !== 0
      ) {
        result = (await uploadAllUnsaveds({
          variables: {
            unsavedExperiences: unsavedExperiencesToUploadData(
              unsavedExperiences,
              unsavedExperiencesEntriesOnly
            ),
            unsavedEntries: savedExperiencesUnsavedEntriesToUploadData(
              savedExperiencesUnsavedEntries,
              savedExperiencesUnsavedEntriesOnly
            )
          }
        })) as UploadAllUnsavedsMutationFnResult;
      } else if (unsavedExperiencesLen !== 0) {
        result = (await uploadUnsavedExperiences({
          variables: {
            input: unsavedExperiencesToUploadData(
              unsavedExperiences,
              unsavedExperiencesEntriesOnly
            )
          }
        })) as UploadAllUnsavedsMutationFnResult;
      } else if (savedExperiencesUnsavedEntriesLen !== 0) {
        result = (await createEntries({
          variables: {
            createEntries: savedExperiencesUnsavedEntriesToUploadData(
              savedExperiencesUnsavedEntries,
              savedExperiencesUnsavedEntriesOnly
            )
          }
        })) as UploadAllUnsavedsMutationFnResult;
      }

      dispatch({
        type: ActionType.uploadResult,
        payload: result.data
      });
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.log(
        "\n\t\tLogging start\n\n\n\n Object.entries(error.networkError)\n",
        Object.entries(error.networkError),
        "\n\n\n\n\t\tLogging ends\n"
      );
    }
  }

  return (
    <div className="components-sync">
      <ModalComponent open={uploading} />

      <SidebarHeader sidebar={true}>
        <div className="components-sync-header">
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
        <div className="ui two item menu">
          {savedExperiencesUnsavedEntriesLen !== 0 && (
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
                (uploadResult.createEntries &&
                uploadResult.createEntries.failures ? (
                  <Icon
                    name="ban"
                    data-testid="unsaved-entries-upload-error-icon"
                    className="upload-error-icon upload-result-icon"
                  />
                ) : (
                  <Icon
                    name="check"
                    data-testid="unsaved-entries-upload-success-icon"
                    className="upload-success-icon upload-result-icon"
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
                (didAllUploadUnsavedExperiencesSucceed(uploadResult) ? (
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
          {savedExperiencesUnsavedEntriesLen !== 0 && tabs["1"] && (
            <CSSTransition
              timeout={timeout}
              key="saved-experiences"
              classNames="pane-animation-left"
            >
              <div
                className={setClassNames({ tab: true, active: tabs["1"] })}
                data-testid="saved-experiences"
              >
                {savedExperiencesUnsavedEntries.map(experience => {
                  return (
                    <SavedExperienceComponent
                      key={experience.id}
                      experience={experience}
                      entries={
                        savedExperiencesUnsavedEntriesOnly[experience.id]
                      }
                    />
                  );
                })}
              </div>
            </CSSTransition>
          )}

          {unsavedExperiencesLen !== 0 && tabs["2"] && (
            <CSSTransition
              timeout={timeout}
              key="unsaved-experiences"
              classNames="pane-animation-right"
            >
              <div
                className={setClassNames({ tab: true, active: tabs["2"] })}
                data-testid="unsaved-experiences"
              >
                {unsavedExperiences.map(experience => {
                  return (
                    <UnSavedExperienceComponent
                      key={experience.id}
                      experience={experience}
                      entries={unsavedExperiencesEntriesOnly[experience.id]}
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

function SavedExperienceComponent({
  experience,
  entries
}: {
  experience: ExperienceFragment;
  entries: ExperienceFragment_entries_edges_node[];
}) {
  const experienceId = experience.id;

  return (
    <div data-testid="saved-experience">
      <div>{experience.title}</div>

      {entries.map(entry => {
        return (
          <Entry
            data-testid={`experience-${experienceId}-unsaved-entry-${entry.id}`}
            key={entry.id}
            entry={entry}
            fieldDefs={experience.fieldDefs as ExperienceFragment_fieldDefs[]}
          />
        );
      })}
    </div>
  );
}

function UnSavedExperienceComponent({
  experience,
  entries
}: {
  experience: UnsavedExperience;
  entries: ExperienceFragment_entries_edges_node[];
}) {
  const experienceId = experience.id;

  return (
    <div data-testid="unsaved-experience">
      <div>{experience.title}</div>

      {entries.map(entry => {
        return (
          <Entry
            data-testid={`unsaved-experience-${experienceId}-entry-${entry.id}`}
            key={entry.id}
            entry={entry}
            fieldDefs={experience.fieldDefs as ExperienceFragment_fieldDefs[]}
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
  unsavedExperiencesEntriesOnly: ExperienceIdToUnsavedEntriesMap
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

function savedExperiencesUnsavedEntriesToUploadData(
  savedExperiencesUnsavedEntries: ExperienceFragment[],
  savedExperiencesUnsavedEntriesOnly: ExperienceIdToUnsavedEntriesMap
) {
  return savedExperiencesUnsavedEntries.reduce(
    (acc, experience) => {
      const entries = savedExperiencesUnsavedEntriesOnly[experience.id].map(
        toUploadableEntry
      );

      return acc.concat(entries);
    },
    [] as CreateEntry[]
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
  return setClassNames({
    item: true,
    active: tabs[tabNumber],
    "tab-menu": true
  });
}

function didAllUploadUnsavedExperiencesSucceed(
  uploadResult: UploadAllUnsavedsMutation
) {
  const result =
    uploadResult.syncOfflineExperiences &&
    uploadResult.syncOfflineExperiences.reduce((acc, elm) => {
      if (!elm || !elm.experience || elm.entriesErrors) {
        return false;
      }

      return acc;
    }, true);

  return result;
}
