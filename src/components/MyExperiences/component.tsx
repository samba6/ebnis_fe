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
import {
  GetExps_exps,
  GetExps_exps_edges,
  GetExps_exps_edges_node
} from "../../graphql/apollo-types/GetExps";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { Link } from "gatsby";
import {
  UnsavedExperience,
  UnsavedExperiencesQueryData
} from "../ExperienceDefinition/resolver-utils";
import { preloadEntries } from "./preload-entries";
import { GetExperiencesData } from "../../graphql/exps.query";
import { ExperienceMiniFragment } from "../../graphql/apollo-types/ExperienceMiniFragment";

export const MyExperiences = (props: Props) => {
  const {
    getExpDefsResult: {
      loading: loadingExperiences,
      exps
    } = {} as GetExperiencesData,

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
  const entriesLoadedRef = useRef(false);

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(MY_EXPERIENCES_TITLE));

    return setDocumentTitle;
  }, []);

  useEffect(() => {
    if (exps && entriesLoadedRef.current === false) {
      const { idToExperienceMap, ids } = mapExperiencesToIds(
        exps as GetExps_exps
      );

      if (ids.length === 0) {
        return;
      }

      preloadEntries({
        ids,
        client,
        idToExperienceMap
      });

      entriesLoadedRef.current = true;
    }
  }, [exps]);

  const unsavedExperiencesAsEdges = useMemo(() => {
    if (!unsavedExperiences) {
      return;
    }

    return unsavedExperiences.map((unsavedExperience: UnsavedExperience) => {
      return ({
        node: unsavedExperience
      } as unknown) as GetExps_exps_edges;
    });
  }, [unsavedExperiences]);

  const experiencesForDisplay = useMemo(() => {
    if (!exps) {
      return unsavedExperiencesAsEdges;
    }

    const edges = (exps.edges || []).concat(unsavedExperiencesAsEdges || []);
    return edges;
  }, [exps, unsavedExperiences]);

  function renderExperiences() {
    if ((experiencesForDisplay as GetExps_exps_edges[]).length === 0) {
      return (
        <Link to={EXPERIENCE_DEFINITION_URL} className="no-exp-info">
          Click here to create your first experience
        </Link>
      );
    }

    return (
      <div data-testid="exps-container" className="exps-container">
        {(experiencesForDisplay as GetExps_exps_edges[]).map(edge => {
          const experience = (edge as GetExps_exps_edges)
            .node as GetExps_exps_edges_node;

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
        })}
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

interface ExperienceProps extends GetExps_exps_edges_node {
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

function mapExperiencesToIds(experienceConnection: GetExps_exps) {
  const edges = experienceConnection.edges as GetExps_exps_edges[];
  const ids: string[] = [];

  const idToExperienceMap = edges.reduce(
    (acc, edge: GetExps_exps_edges) => {
      const node = edge.node as GetExps_exps_edges_node;

      const { id } = node;
      acc[id] = node;
      ids.push(id);
      return acc;
    },
    {} as { [k: string]: ExperienceMiniFragment }
  );

  return { idToExperienceMap, ids };
}
