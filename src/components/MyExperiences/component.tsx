import React, { useEffect, useReducer, useRef, useMemo } from "react";
import { Icon } from "semantic-ui-react";

import "./styles.scss";
import {
  Props,
  reducer,
  initialState,
  DispatchType,
  ActionTypes
} from "./utils";
import { EXPERIENCE_DEFINITION_URL } from "../../routes";
import { makeExperienceRoute } from "../../constants/experience-route";
import { Loading } from "../Loading";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { Link } from "gatsby";
import {
  UnsavedExperience,
  UnsavedExperiencesQueryData
} from "../ExperienceDefinition/resolver-utils";
import { preFetchExperiences } from "./pre-fetch-experiences";
import { GetExperienceConnectionMiniData } from "../../graphql/get-experience-connection-mini.query";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";
import {
  ExperienceConnectionFragment,
  ExperienceConnectionFragment_edges,
  ExperienceConnectionFragment_edges_node
} from "../../graphql/apollo-types/ExperienceConnectionFragment";

export const MyExperiences = (props: Props) => {
  const {
    getExperiencesMiniProps: {
      loading: loadingExperiences,
      getExperiences
    } = {} as GetExperienceConnectionMiniData,

    unsavedExperiencesProps: {
      loading: loadingUnsavedExperiences,
      unsavedExperiences
    } = {} as UnsavedExperiencesQueryData,

    client
  } = props;

  const loading = loadingExperiences || loadingUnsavedExperiences;

  const [state, dispatch] = useReducer(reducer, initialState);

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
      getExperiences as ExperienceConnectionFragment
    );

    if (ids.length === 0) {
      return;
    }

    setTimeout(() => {
      preFetchExperiences({
        ids,
        client,
        idToExperienceMap
      });
    }, 1000);

    preFetchExperiencesRef.current = true;
  }, [getExperiences]);

  const unsavedExperiencesAsEdges = useMemo(() => {
    if (!unsavedExperiences) {
      return;
    }

    return unsavedExperiences.map((unsavedExperience: UnsavedExperience) => {
      return ({
        node: unsavedExperience
      } as unknown) as ExperienceConnectionFragment_edges;
    });
  }, [unsavedExperiences]);

  const experiencesForDisplay = useMemo(() => {
    if (!getExperiences) {
      return unsavedExperiencesAsEdges;
    }

    const edges = (getExperiences.edges || []).concat(
      unsavedExperiencesAsEdges || []
    );
    return edges;
  }, [getExperiences, unsavedExperiences]);

  function renderExperiences() {
    if (
      (experiencesForDisplay as ExperienceConnectionFragment_edges[]).length ===
      0
    ) {
      return (
        <Link to={EXPERIENCE_DEFINITION_URL} className="no-exp-info">
          Click here to create your first experience
        </Link>
      );
    }

    return (
      <div data-testid="exps-container" className="exps-container">
        {(experiencesForDisplay as ExperienceConnectionFragment_edges[]).map(
          edge => {
            const experience = (edge as ExperienceConnectionFragment_edges)
              .node as ExperienceConnectionFragment_edges_node;

            const { id, ...rest } = experience;

            return (
              <Experience
                key={id}
                showingDescription={state.toggleDescriptionStates[id]}
                dispatch={dispatch}
                id={id}
                {...rest}
              />
            );
          }
        )}
      </div>
    );
  }

  function renderMain() {
    if (loading) {
      return <Loading loading={loading} />;
    }

    return (
      <>
        {renderExperiences()}

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

interface ExperienceProps extends ExperienceConnectionFragment_edges_node {
  showingDescription: boolean;
  dispatch: DispatchType;
}

const Experience = React.memo(
  function ExperienceFn({
    showingDescription,
    dispatch,
    title,
    description,
    id
  }: ExperienceProps) {
    return (
      <div className="exp-container">
        <ShowDescriptionToggle
          description={description}
          showingDescription={showingDescription}
          id={id}
          dispatch={dispatch}
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
  }
);

const ShowDescriptionToggle = React.memo(
  function ShowDescriptionToggleFn({
    description,
    showingDescription,
    id,
    dispatch
  }: {
    description: string | null;
    showingDescription: boolean;
    id: string;
    dispatch: DispatchType;
  }) {
    if (!description) {
      return null;
    }

    const props = {
      className: "reveal-hide-description",

      "data-testid": `exp-toggle-${id}`,

      onClick: () =>
        dispatch({
          type: ActionTypes.setToggleDescription,
          payload: id
        })
    };

    return showingDescription ? (
      <Icon name="caret down" {...props} />
    ) : (
      <Icon name="caret right" {...props} />
    );
  },

  function ShowDescriptionToggleDiff(oldProps, newProps) {
    return oldProps.showingDescription === newProps.showingDescription;
  }
);

function mapExperiencesToIds(
  experienceConnection: ExperienceConnectionFragment
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
    {} as { [k: string]: ExperienceMiniFragment }
  );

  return { idToExperienceMap, ids };
}
