import React, { useEffect, useRef, useState, useCallback } from "react";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";

import "./styles.scss";
import { Props } from "./utils";
import { EXPERIENCE_DEFINITION_URL } from "../../routes";
import { makeExperienceRoute } from "../../constants/experience-route";
import { Loading } from "../Loading";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { Link } from "gatsby";
import { preFetchExperiences } from "./pre-fetch-experiences";
import { GetExperienceConnectionMiniData } from "../../graphql/get-experience-connection-mini.query";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";
import {
  ExperienceConnectionFragment,
  ExperienceConnectionFragment_edges,
  ExperienceConnectionFragment_edges_node,
} from "../../graphql/apollo-types/ExperienceConnectionFragment";
import { GetExperienceConnectionMini_getExperiences } from "../../graphql/apollo-types/GetExperienceConnectionMini";

export const MyExperiences = (props: Props) => {
  const {
    getExperiencesMiniProps: {
      loading,
      getExperiences,
    } = {} as GetExperienceConnectionMiniData,

    client,
  } = props;

  const [descriptionToggleMap, toggleDescription] = useState<DescriptionMap>(
    {},
  );

  // make sure we are only loading entries in the background once and not on
  // every render
  const preFetchExperiencesRef = useRef(false);

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(MY_EXPERIENCES_TITLE));

    return setDocumentTitle;
  }, []);

  useEffect(() => {
    if (preFetchExperiencesRef.current === true) {
      return;
    }

    if (!getExperiences) {
      return;
    }

    const { idToExperienceMap, ids } = mapExperiencesToIds(
      getExperiences as ExperienceConnectionFragment,
    );

    if (ids.length === 0) {
      return;
    }

    setTimeout(() => {
      preFetchExperiences({
        ids,
        client,
        idToExperienceMap,
      });
    }, 1000);

    preFetchExperiencesRef.current = true;
  }, [getExperiences, client]);

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
    const edges = experiencesForDisplay.edges || [];

    if (edges.length === 0) {
      return (
        <Link to={EXPERIENCE_DEFINITION_URL} className="no-exp-info">
          Click here to create your first experience
        </Link>
      );
    }

    return (
      <div data-testid="exps-container" className="exps-container">
        {edges.map(edge => {
          const experience = (edge as ExperienceConnectionFragment_edges)
            .node as ExperienceConnectionFragment_edges_node;

          const { id, ...rest } = experience;

          return (
            <Experience
              key={id}
              showingDescription={descriptionToggleMap[id]}
              toggleDescription={toggleDescriptionFn}
              id={id}
              {...rest}
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
      return null;
    }

    return (
      <>
        {renderExperiences(getExperiences)}

        <Link
          className="new-exp-btn"
          data-testid="go-to-new-exp"
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

interface ExperienceProps
  extends ExperienceConnectionFragment_edges_node,
    ToggleDescription {
  showingDescription: boolean;
}

const Experience = React.memo(
  function ExperienceFn({
    showingDescription,
    toggleDescription,
    title,
    description,
    id,
  }: ExperienceProps) {
    return (
      <div className="exp-container">
        <ShowDescriptionToggle
          description={description}
          showingDescription={showingDescription}
          id={id}
          toggleDescription={toggleDescription}
        />

        <Link
          className="exp-container-main"
          to={makeExperienceRoute(id)}
          data-testid={`experience-main-${id}`}
        >
          <span className="exp_title">{title}</span>

          {showingDescription && (
            <div className="exp_description">{description}</div>
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
    description,
    showingDescription,
    id,
    toggleDescription,
  }: ToggleDescription & {
    description: string | null;
    showingDescription: boolean;
    id: string;
  }) {
    if (!description) {
      return null;
    }

    const props = {
      className: "reveal-hide-description",

      "data-testid": `exp-toggle-${id}`,

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

function mapExperiencesToIds(
  experienceConnection: ExperienceConnectionFragment,
) {
  const edges = experienceConnection.edges as ExperienceConnectionFragment_edges[];
  const ids: string[] = [];

  const idToExperienceMap = edges.reduce(
    (acc, edge: ExperienceConnectionFragment_edges) => {
      const node = edge.node as ExperienceConnectionFragment_edges_node;

      const { id } = node;
      acc[id] = node;
      ids.push(id);
      return acc;
    },
    {} as { [k: string]: ExperienceMiniFragment },
  );

  return { idToExperienceMap, ids };
}

interface DescriptionMap {
  [k: string]: boolean;
}

interface ToggleDescription {
  toggleDescription: (id: string) => void;
}
