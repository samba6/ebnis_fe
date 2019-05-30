import React, { useEffect, useReducer } from "react";
import { Icon } from "semantic-ui-react";

import "./styles.scss";
import {
  Props,
  reducer,
  initialState,
  DispatchType,
  ActionTypes
} from "./utils";
import { EXPERIENCE_DEFINITION_URL, makeExperienceRoute } from "../../routes";
import Loading from "../Loading";
import { GetExps_exps } from "../../graphql/apollo-types/GetExps";
import { SidebarHeader } from "../SidebarHeader";
import {
  setDocumentTitle,
  makeSiteTitle,
  MY_EXPERIENCES_TITLE
} from "../../constants";
import { Link } from "gatsby";

export const MyExperiences = (props: Props) => {
  const {
    getExpDefsResult: { loading, exps }
  } = props;

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(MY_EXPERIENCES_TITLE));

    return setDocumentTitle;
  }, []);

  function renderExperiences() {
    if (!(exps && exps.length)) {
      return (
        <Link to={EXPERIENCE_DEFINITION_URL} className="no-exp-info">
          Click here to create your first experience
        </Link>
      );
    }

    return (
      <div data-testid="exps-container" className="exps-container">
        {exps.map(experience => {
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
    if (loading) {
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

        <Link className="exp-container-main" to={makeExperienceRoute(id)}>
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
