import React, { useState } from "react";
import { Props } from "./utils";
import { Loading } from "../Loading";
import {
  UnsavedExperiencesData,
  UnsavedEntriesSavedExperiencesData,
  entryNodesFromExperience
} from "../../state/sync-unsaved-resolver";
import { SidebarHeader } from "../SidebarHeader";
import {
  ExperienceFragment,
  ExperienceFragment_fieldDefs
} from "../../graphql/apollo-types/ExperienceFragment";
import { isUnsavedId } from "../../constants";
import { Entry } from "../Experience/entry";
import "./styles.scss";
import { UnsavedExperience } from "../ExperienceNewEntryParent/resolvers";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import setClassNames from "classnames";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";

export function Sync(props: Props) {
  const {
    unSavedExperiencesProps: {
      loading: loadingUnsavedExperiences,
      unsavedExperiences = []
    } = {} as UnsavedExperiencesData,

    unSavedEntriesSavedExperiencesProps: {
      loading: loadingUnSavedEntriesSavedExperiences,
      unsavedEntriesSavedExperiences = []
    } = {} as UnsavedEntriesSavedExperiencesData
  } = props;

  const unsavedEntriesSavedExperiencesLen =
    unsavedEntriesSavedExperiences.length;

  const unsavedExperiencesLen = unsavedExperiences.length;

  const [tabs, toggleTabs] = useState<{ [k: number]: boolean }>({
    1: unsavedEntriesSavedExperiencesLen !== 0,
    2: unsavedEntriesSavedExperiencesLen === 0 && unsavedExperiencesLen !== 0
  });

  const unSavedCount =
    unsavedEntriesSavedExperiencesLen + unsavedExperiencesLen;

  const loading =
    loadingUnsavedExperiences || loadingUnSavedEntriesSavedExperiences;

  if (loading && unSavedCount === 0) {
    return <Loading />;
  }

  if (unSavedCount === 0) {
    return <div data-testid="no-unsaved">There are no unsaved data</div>;
  }

  return (
    <div className="components-sync">
      <SidebarHeader sidebar={true}>
        <div className="components-sync-header">
          <span>Unsaved Preview</span>
          <Icon name="sync" />
        </div>
      </SidebarHeader>

      <div className="main">
        <div className="ui two item menu">
          {unsavedEntriesSavedExperiencesLen !== 0 && (
            <a
              className={setClassNames({ item: true, active: tabs["1"] })}
              data-testid="saved-experiences-menu"
              onClick={() => {
                toggleTabs({ 1: true, 2: false });
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
                toggleTabs({ 1: false, 2: true });
              }}
            >
              Experiences
            </a>
          )}
        </div>

        <TransitionGroup className="all-unsaveds">
          {unsavedEntriesSavedExperiencesLen !== 0 && tabs["1"] && (
            <CSSTransition
              timeout={1000}
              key="saved-experiences"
              classNames="pane-animation-left"
            >
              <div
                className={setClassNames({ tab: true, active: tabs["1"] })}
                data-testid="saved-experiences"
              >
                {unsavedEntriesSavedExperiences.map(experience => {
                  return (
                    <SavedExperience
                      key={experience.id}
                      experience={experience}
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

function SavedExperience({ experience }: { experience: ExperienceFragment }) {
  const experienceId = experience.id;

  const entries = entryNodesFromExperience(experience);

  const unSavedEntries = entries.filter(entry => isUnsavedId(entry.id));

  return (
    <div data-testid="saved-experience">
      <div>{experience.title}</div>

      {unSavedEntries.map(entry => {
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

function UnSavedExperience({ experience }: { experience: UnsavedExperience }) {
  const experienceId = experience.id;

  const entries = entryNodesFromExperience(
    (experience as unknown) as ExperienceFragment
  );

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
