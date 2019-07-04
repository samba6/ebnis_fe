import React, { useEffect, useState, useCallback, useContext } from "react";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";

import "./styles.scss";
import { Props } from "./utils";
import { EXPERIENCE_DEFINITION_URL } from "../../routes";
import { makeExperienceRoute } from "../../constants/experience-route";
import { Loading } from "../Loading";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle, isUnsavedId } from "../../constants";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { Link } from "gatsby";
import { preFetchExperiences } from "./pre-fetch-experiences";
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
import { LayoutContext, LayoutActionType } from "../Layout/utils";

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

  // make sure we are only loading entries in the background and only once
  // on app boot.
  const { experiencesPreFetched, layoutDispatch, cache } = useContext(
    LayoutContext,
  );

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(MY_EXPERIENCES_TITLE));

    return setDocumentTitle;
  }, []);

  useEffect(() => {
    // istanbul ignore next:
    if (experiencesPreFetched === true) {
      return;
    }

    if (!getExperiences) {
      return;
    }

    const ids = mapSavedExperiencesToIds(
      getExperiences as ExperienceConnectionFragment,
    );

    if (ids.length === 0) {
      return;
    }

    setTimeout(() => {
      preFetchExperiences({
        ids,
        client,
        cache,
        onDone: () => {
          layoutDispatch([LayoutActionType.setExperiencesPreFetched, true]);
        },
      });
    }, 1000);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getExperiences, experiencesPreFetched]);

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
      return (
        <div data-testid="no-experiences-error">Error loading experiences</div>
      );
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

function mapSavedExperiencesToIds(
  experienceConnection: ExperienceConnectionFragment,
) {
  return (experienceConnection.edges as ExperienceConnectionFragment_edges[]).reduce(
    (acc, edge: ExperienceConnectionFragment_edges) => {
      const { id } = edge.node as ExperienceConnectionFragment_edges_node;

      if (!isUnsavedId(id)) {
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
