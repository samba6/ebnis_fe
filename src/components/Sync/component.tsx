import React, { useReducer, useMemo } from "react";
import { Props, reducer, ActionType } from "./utils";
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
  ExperienceFragment_entries_edges_node
} from "../../graphql/apollo-types/ExperienceFragment";
import { isUnsavedId } from "../../constants";
import { Entry } from "../Experience/entry";
import "./styles.scss";
import { UnsavedExperience } from "../ExperienceNewEntryParent/resolvers";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import setClassNames from "classnames";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import { CreateEntry } from "../../graphql/apollo-types/globalTypes";

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

    createEntries
  } = props;

  const savedExperiencesUnsavedEntriesLen =
    savedExperiencesUnsavedEntries.length;

  const unsavedExperiencesLen = unsavedExperiences.length;

  const [state, dispatch] = useReducer(reducer, {
    tabs: {
      1: savedExperiencesUnsavedEntriesLen !== 0,
      2: savedExperiencesUnsavedEntriesLen === 0 && unsavedExperiencesLen !== 0
    }
  });

  const { tabs, uploading } = state;

  const unSavedCount =
    savedExperiencesUnsavedEntriesLen + unsavedExperiencesLen;

  const loading =
    loadingUnsavedExperiences || loadingSavedExperiencesUnsavedEntries;

  const savedExperiencesUnsavedEntriesOnly = useMemo(() => {
    let unsavedEntries = {} as {
      [k: string]: ExperienceFragment_entries_edges_node[];
    };

    if (savedExperiencesUnsavedEntriesLen !== 0) {
      unsavedEntries = savedExperiencesUnsavedEntries.reduce(
        (acc, experience) => {
          acc[experience.id] = entryNodesFromExperience(experience).filter(
            entry => isUnsavedId(entry.id)
          );

          return acc;
        },
        unsavedEntries
      );
    }

    return unsavedEntries;
  }, [savedExperiencesUnsavedEntries]);

  const unsavedExperiencesEntriesOnly = useMemo(() => {
    let unsavedEntries = {} as {
      [k: string]: ExperienceFragment_entries_edges_node[];
    };

    if (unsavedExperiencesLen !== 0) {
      unsavedEntries = unsavedExperiences.reduce((acc, experience) => {
        acc[experience.id] = entryNodesFromExperience(
          (experience as unknown) as ExperienceFragment
        );

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

    const promises = [];

    if (unsavedExperiencesLen !== 0) {
      promises.push(
        uploadUnsavedExperiences({
          variables: {
            input: unsavedExperiences.map(experience => {
              const entries = unsavedExperiencesEntriesOnly[experience.id].map(
                toUploadableEntry
              );

              return {
                entries,
                title: experience.title,
                clientId: experience.clientId,
                fieldDefs: experience.fieldDefs,
                insertedAt: experience.insertedAt,
                updatedAt: experience.updatedAt,
                description: experience.description
              };
            })
          }
        })
      );
    }

    if (savedExperiencesUnsavedEntriesLen !== 0) {
      promises.push(
        createEntries({
          variables: {
            createEntries: savedExperiencesUnsavedEntries.reduce(
              (acc, experience) => {
                const entries = savedExperiencesUnsavedEntriesOnly[
                  experience.id
                ].map(toUploadableEntry);

                return acc.concat(entries);
              },
              [] as CreateEntry[]
            )
          }
        })
      );
    }

    const [] = await Promise.all(promises);

    // dispatch({
    //   type: ActionType.setUploading,
    //   payload: false
    // })
  }

  return (
    <div className="components-sync">
      {uploading && <div data-testid="uploading-data" />}

      <SidebarHeader sidebar={true}>
        <div className="components-sync-header">
          <span>Unsaved Preview</span>

          <Icon
            name="sync"
            data-testid="upload-all"
            onClick={onUploadAllClicked}
          />
        </div>
      </SidebarHeader>

      <div className="main">
        <div className="ui two item menu">
          {savedExperiencesUnsavedEntriesLen !== 0 && (
            <a
              className={setClassNames({ item: true, active: tabs["1"] })}
              data-testid="saved-experiences-menu"
              onClick={() => {
                dispatch({
                  type: ActionType.toggleTab,
                  payload: 1
                });
              }}
            >
              Entries
            </a>
          )}

          {unsavedExperiencesLen !== 0 && (
            <a
              className={setClassNames({ item: true, active: tabs["2"] })}
              data-testid="unsaved-experiences-menu"
              onClick={() => {
                dispatch({
                  type: ActionType.toggleTab,
                  payload: 2
                });
              }}
            >
              Experiences
            </a>
          )}
        </div>

        <TransitionGroup className="all-unsaveds">
          {savedExperiencesUnsavedEntriesLen !== 0 && tabs["1"] && (
            <CSSTransition
              timeout={1000}
              key="saved-experiences"
              classNames="pane-animation-left"
            >
              <div
                className={setClassNames({ tab: true, active: tabs["1"] })}
                data-testid="saved-experiences"
              >
                {savedExperiencesUnsavedEntries.map(experience => {
                  return (
                    <SavedExperience
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
              timeout={1000}
              key="unsaved-experiences"
              classNames="pane-animation-right"
            >
              <div
                className={setClassNames({ tab: true, active: tabs["2"] })}
                data-testid="unsaved-experiences"
              >
                {unsavedExperiences.map(experience => {
                  return (
                    <UnSavedExperience
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

function SavedExperience({
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

function UnSavedExperience({
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
  return {
    expId: entry.expId,
    clientId: entry.clientId,
    fields: entry.fields,
    insertedAt: entry.insertedAt,
    updatedAt: entry.updatedAt
  };
}
