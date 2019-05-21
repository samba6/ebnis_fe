import React, { useEffect, useState } from "react";
import { Icon } from "semantic-ui-react";
import { NavigateFn } from "@reach/router";

import "./styles.scss";
import { Props } from "./utils";
import { EXPERIENCE_DEFINITION_URL, makeExperienceRoute } from "../../routes";
import Loading from "../Loading";
import { GetExps_exps } from "../../graphql/apollo-types/GetExps";
import { SidebarHeader } from "../SidebarHeader";
import {
  setDocumentTitle,
  makeSiteTitle,
  MY_EXPERIENCES_TITLE
} from "../../constants";

export const MyExperiences = (props: Props) => {
  const {
    navigate,
    getExpDefsResult: { loading, exps }
  } = props;
  const [toggleDescriptions, setToggleDescriptions] = useState<{
    [k: string]: boolean;
  }>({});

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(MY_EXPERIENCES_TITLE));

    return setDocumentTitle;
  }, []);

  function goToNewExp() {
    (navigate as NavigateFn)(EXPERIENCE_DEFINITION_URL);
  }

  function renderExperiences() {
    if (!(exps && exps.length)) {
      return (
        <span onClick={goToNewExp} className="no-exp-info">
          Click here to create your first experience
        </span>
      );
    }

    return (
      <div data-testid="exps-container" className="exps-container">
        {exps.map((exp, index) => (
          <Experience
            key={index}
            expDef={exp}
            index={index}
            toggleDescriptions={toggleDescriptions}
            setToggleDescriptions={setToggleDescriptions}
            navigate={navigate as NavigateFn}
          />
        ))}
      </div>
    );
  }

  function renderMain() {
    if (loading) {
      return <Loading />;
    }

    return (
      <>
        {renderExperiences()}

        <button
          className="new-exp-btn"
          name="go-to-new-exp"
          type="button"
          onClick={goToNewExp}
          data-testid="go-to-new-exp"
        >
          +
        </button>
      </>
    );
  }

  return (
    <div className="components-experiences">
      <SidebarHeader title="My Experiences" sidebar={true} />

      <div className="main">{renderMain()}</div>
    </div>
  );
};

interface ExperienceProps {
  expDef: GetExps_exps | null;
  index: number;
  toggleDescriptions: { [k: string]: boolean };
  setToggleDescriptions: (toggleDescriptions: { [k: string]: boolean }) => void;
  navigate: NavigateFn;
}

const Experience = React.memo(
  function ExperienceFn({
    expDef: expDef1,
    index,
    toggleDescriptions,
    setToggleDescriptions,
    navigate
  }: ExperienceProps) {
    const expDef = expDef1 as GetExps_exps;

    const { title, description, id } = expDef;
    const showingDescription = toggleDescriptions[index];

    return (
      <div key={index} className="exp-container" data-index={index}>
        <ShowDescriptionToggle
          description={description}
          showingDescription={showingDescription}
          id={id}
          onClick={() => {
            setToggleDescriptions({
              ...toggleDescriptions,
              [index]: !toggleDescriptions[index]
            });
          }}
        />

        <div
          className="exp-container-main"
          onClick={() => (navigate as NavigateFn)(makeExperienceRoute(id))}
        >
          <span className="exp_title">{title}</span>

          {showingDescription && (
            <div className="exp_description">{description}</div>
          )}
        </div>
      </div>
    );
  },

  function ExperiencePropsDiff(prevProps, currProps) {
    if (
      prevProps.toggleDescriptions[prevProps.index] !==
      currProps.toggleDescriptions[currProps.index]
    ) {
      return false;
    }

    return true;
  }
);

const ShowDescriptionToggle = React.memo(
  function ShowDescriptionToggleFn({
    description,
    showingDescription,
    id,
    onClick
  }: {
    description: string | null;
    showingDescription: boolean;
    id: string;
    onClick: () => void;
  }) {
    if (!description) {
      return null;
    }

    if (!showingDescription) {
      return (
        <Icon
          data-testid={`exp-toggle-${id}`}
          name="caret right"
          className="reveal-hide-description"
          onClick={onClick}
        />
      );
    }

    return (
      <Icon
        data-testid={`exp-toggle-${id}`}
        name="caret down"
        className="reveal-hide-description"
        onClick={onClick}
      />
    );
  },

  function ShowDescriptionToggleDiff(oldProps, newProps) {
    return oldProps.showingDescription === newProps.showingDescription;
  }
);
