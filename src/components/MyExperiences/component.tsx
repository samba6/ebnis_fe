import React, { useEffect, useReducer, useRef } from "react";
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
import Loading from "../Loading";
import { GetExps_exps } from "../../graphql/apollo-types/GetExps";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { Link } from "gatsby";
import { EXPERIENCES_OFFLINE_QUERY } from "./local.queries";
import { LIST_EXPERIENCES_ENTRIES } from "../../graphql/list-experiences-entries";
import {
  ListExperiencesEntries,
  ListExperiencesEntriesVariables
} from "../../graphql/apollo-types/ListExperiencesEntries";

export const MyExperiences = (props: Props) => {
  const {
    getExpDefsResult,
    isConnected,
    unsavedExperiences = [],
    client
  } = props;

  const { loading, exps, networkStatus } = getExpDefsResult;

  const [state, dispatch] = useReducer(reducer, initialState);

  // make sure we are only loading entries in the background once and not on
  // every render
  const entriesLoadedRef = useRef(false);

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(MY_EXPERIENCES_TITLE));

    return setDocumentTitle;
  }, []);

  useEffect(() => {
    // force read from cache if we are offline and user visits page directly
    // from browser address bar (perhaps I should file an issue with absinthe-
    // socket npm package managers. http behaves appropriately)

    if (!exps && networkStatus === 1 && loading && !isConnected) {
      client.query({
        query: EXPERIENCES_OFFLINE_QUERY
      });
    }
  }, [isConnected, loading, networkStatus, exps]);

  useEffect(() => {
    if (exps && !entriesLoadedRef.current) {
      client.query<ListExperiencesEntries, ListExperiencesEntriesVariables>({
        query: LIST_EXPERIENCES_ENTRIES,
        variables: {
          input: {
            experiencesIds: (exps as GetExps_exps[]).map(({ id }) => id),
            pagination: {
              first: 10
            }
          }
        }
      });

      entriesLoadedRef.current = true;
    }
  }, [exps]);

  function renderExperiences() {
    let experiencesForDisplay = unsavedExperiences as GetExps_exps[];

    if (exps) {
      experiencesForDisplay = (exps as GetExps_exps[]).concat(
        unsavedExperiences
      );
    }

    if (!experiencesForDisplay.length) {
      return (
        <Link to={EXPERIENCE_DEFINITION_URL} className="no-exp-info">
          Click here to create your first experience
        </Link>
      );
    }

    return (
      <div data-testid="exps-container" className="exps-container">
        {experiencesForDisplay.map(experience => {
          const { id, ...rest } = experience as GetExps_exps;

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
    if (loading && !exps) {
      return <Loading />;
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

interface ExperienceProps extends GetExps_exps {
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
