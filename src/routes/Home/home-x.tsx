import React, { useEffect, useState } from "react";
import { Icon } from "semantic-ui-react";

import "./home.scss";
import { Props } from "./home";
import SidebarHeader from "../../components/SidebarHeader";
import { setTitle, NEW_EXP_URL, makeExpRoute } from "../../Routing";
import Loading from "../../components/Loading";
import { GetExps_exps } from "../../graphql/apollo-gql";

export const Home = (props: Props) => {
  const { history, loading, exps } = props;
  const [toggleDescriptions, setToggleDescriptions] = useState<{
    [k: string]: boolean;
  }>({});

  useEffect(() => {
    setTitle("Home");

    return setTitle;
  }, []);

  function goToNewExp() {
    history.push(NEW_EXP_URL);
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
        {exps.map(renderExperience)}
      </div>
    );
  }

  function renderExperience(expDef: GetExps_exps | null, index: number) {
    if (!expDef) {
      return null;
    }

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

        <div className="main" onClick={() => history.push(makeExpRoute(id))}>
          <span className="exp_title">{title}</span>

          {showingDescription && (
            <div className="exp_description">{description}</div>
          )}
        </div>
      </div>
    );
  }

  function renderMain() {
    if (loading) {
      return <Loading />;
    }

    return (
      <div className="route-main" data-testid="home-route-main">
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
      </div>
    );
  }

  return (
    <div className="app-container">
      <SidebarHeader title="Home" sidebar={true} />

      <div className="app-main routes-home">{renderMain()}</div>
    </div>
  );
};

export default Home;

function ShowDescriptionToggle({
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
}
