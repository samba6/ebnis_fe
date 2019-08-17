import React, { useEffect, useState, useCallback, useContext } from "react";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";

import "./styles.scss";
import { Props } from "./my-experiences.utils";
import { EXPERIENCE_DEFINITION_URL } from "../../routes";
import { makeExperienceRoute } from "../../constants/experience-route";
import { Loading } from "../Loading";
import { SidebarHeader } from "../SidebarHeader/sidebar-header";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { Link } from "gatsby";
import { GetExperienceConnectionMiniData } from "../../graphql/get-experience-connection-mini.query";
import {
  ExperienceConnectionFragment,
  ExperienceConnectionFragment_edges,
  ExperienceConnectionFragment_edges_node,
} from "../../graphql/apollo-types/ExperienceConnectionFragment";
import {
  GetExperienceConnectionMini_getExperiences,
  GetExperienceConnectionMini_getExperiences_edges,
} from "../../graphql/apollo-types/GetExperienceConnectionMini";
import { LayoutContext, LayoutActionType } from "../Layout/layout.utils";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";

export const MyExperiences = (props: Props) => {
  const {
    getExperiencesMiniProps: {
      loading,
      getExperiences,
    } = {} as GetExperienceConnectionMiniData,
  } = props;

  const [descriptionToggleMap, toggleDescription] = useState<DescriptionMap>(
    {},
  );

  // make sure we are only loading entries in the background and only once
  // on app boot.
  const { layoutDispatch } = useContext(LayoutContext);

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(MY_EXPERIENCES_TITLE));

    return setDocumentTitle;
  }, []);

  useEffect(() => {
    if (!getExperiences) {
      return;
    }

    setTimeout(() => {
      const ids = mapSavedExperiencesToIds(
        getExperiences as ExperienceConnectionFragment,
      );

      if (ids.length === 0) {
        return;
      }

      layoutDispatch([LayoutActionType.setExperiencesToPreFetch, ids]);
    }, 1000);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getExperiences]);

  const toggleDescriptionFn = useCallback(
    (id: string) => {
      toggleDescription(currentSate => {
        return { ...currentSate, [id]: !currentSate[id] };
      });
    },
    [toggleDescription],
  );

  function renderExperiences(
    experiencesForDisplay: GetExperienceConnectionMini_getExperiences,
  ) {
    const edges = experiencesForDisplay.edges as GetExperienceConnectionMini_getExperiences_edges[];

    if (edges.length === 0) {
      return (
        <Link
          to={EXPERIENCE_DEFINITION_URL}
          className="no-experiences-info"
          id="no-experiences-info"
        >
          Click here to create your first experience
        </Link>
      );
    }

    return (
      <div id="experiences-container" className="experiences-container">
        {edges.map(edge => {
          const experience = (edge as ExperienceConnectionFragment_edges)
            .node as ExperienceConnectionFragment_edges_node;

          const { id } = experience;

          return (
            <Experience
              key={id}
              showingDescription={descriptionToggleMap[id]}
              toggleDescription={toggleDescriptionFn}
              experience={experience}
            />
          );
        })}
      </div>
    );
  }

  function renderMain() {
    if (loading) {
      return <Loading loading={loading} />;
    }

    if (!getExperiences) {
      return <div id="no-experiences-error">Error loading experiences</div>;
    }

    return (
      <>
        {renderExperiences(getExperiences)}

        <Link
          className="new-experience-button"
          id="new-experience-button"
          to={EXPERIENCE_DEFINITION_URL}
        >
          +
        </Link>
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

interface ExperienceProps extends ToggleDescription {
  showingDescription: boolean;
  experience: ExperienceConnectionFragment_edges_node;
}

const Experience = React.memo(
  function ExperienceFn({
    showingDescription,
    toggleDescription,
    experience,
  }: ExperienceProps) {
    const { title, description, id } = experience;

    return (
      <div className="exp-container">
        <ShowDescriptionToggle
          showingDescription={showingDescription}
          experience={experience}
          toggleDescription={toggleDescription}
        />

        <Link
          className="exp-container-main"
          to={makeExperienceRoute(id)}
          id={`experience-main-${id}`}
        >
          <span className="experience-title" id={`experience-title-${id}`}>
            {title}
          </span>

          {showingDescription && (
            <div
              className="experience-description"
              id={`experience-description-${id}`}
            >
              {description}
            </div>
          )}
        </Link>
      </div>
    );
  },

  function ExperienceDiff(prevProps, currProps) {
    return prevProps.showingDescription === currProps.showingDescription;
  },
);

const ShowDescriptionToggle = React.memo(
  function ShowDescriptionToggleFn({
    showingDescription,
    experience: { id, description },
    toggleDescription,
  }: ToggleDescription & {
    experience: ExperienceMiniFragment;
    showingDescription: boolean;
  }) {
    if (!description) {
      return null;
    }

    const props = {
      className: "reveal-hide-description",

      id: `experience-description-toggle-${id}`,

      onClick: () => toggleDescription(id),
    };

    return showingDescription ? (
      <Icon name="caret down" {...props} />
    ) : (
      <Icon name="caret right" {...props} />
    );
  },

  function ShowDescriptionToggleDiff(oldProps, newProps) {
    return oldProps.showingDescription === newProps.showingDescription;
  },
);

function mapSavedExperiencesToIds(
  experienceConnection: ExperienceConnectionFragment,
) {
  return (experienceConnection.edges as ExperienceConnectionFragment_edges[]).reduce(
    (acc, edge: ExperienceConnectionFragment_edges) => {
      const {
        hasUnsaved,
        id,
      } = edge.node as ExperienceConnectionFragment_edges_node;

      if (!hasUnsaved) {
        acc.push(id);
      }

      return acc;
    },
    [] as string[],
  );
}

interface DescriptionMap {
  [k: string]: boolean;
}

interface ToggleDescription {
  toggleDescription: (id: string) => void;
}
