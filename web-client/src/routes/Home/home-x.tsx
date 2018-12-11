import React, { useEffect, useState } from "react";
import { Icon } from "semantic-ui-react";

import "./home.scss";
import { Props } from "./home";
import SidebarHeader from "../../components/SidebarHeader";
import { setTitle, NEW_EXP_URL, makeExpRoute } from "../../Routing";
import Loading from "../../components/Loading";
import { GetExps_exps } from "../../graphql/apollo-gql.d";

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
      <div className="exp-defs-container" onClick={handleDefsClick}>
        {exps.map(renderExperience)}
      </div>
    );
  }

  function renderExperience(expDef: GetExps_exps | null, index: number) {
    if (!expDef) {
      return null;
    }

    const { title, description } = expDef;
    const showingDescription = toggleDescriptions[index];

    return (
      <div key={index} className="exp-container" data-index={index}>
        {showDescriptionToggle(description, showingDescription)}

        <div className="main">
          <span className="exp_title">{title}</span>

          {showingDescription && (
            <div className="exp_description">{description}</div>
          )}
        </div>
      </div>
    );
  }

  function handleDefsClick(evt: React.MouseEvent<HTMLDivElement>) {
    const target = evt.target as HTMLDivElement;
    const container = target.closest(".exp-container") as HTMLDivElement;

    if (!(container && exps)) {
      return;
    }

    const index = container.dataset.index;

    if (index === undefined) {
      return;
    }

    const def = exps[index];

    if (!def) {
      return;
    }

    const { classList } = target;
    const { id } = def;

    if (classList.contains("exp_title")) {
      history.push(makeExpRoute(id));
      return;
    }

    if (classList.contains("exp_description")) {
      history.push(makeExpRoute(id));
      return;
    }

    if (target.classList.contains("reveal-hide-description")) {
      setToggleDescriptions({
        ...toggleDescriptions,
        [index]: !toggleDescriptions[index]
      });

      return;
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="app-container">
      <SidebarHeader title="Home" sidebar={true} />

      <div className="app-main routes-home">
        {renderExperiences()}

        <button
          className="new-exp-btn"
          name="go-to-new-exp"
          type="button"
          onClick={goToNewExp}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default Home;

function showDescriptionToggle(
  description: string | null,
  showingDescription: boolean
) {
  if (!description) {
    return null;
  }

  if (!showingDescription) {
    return <Icon name="caret right" className="reveal-hide-description" />;
  }

  return <Icon name="caret down" className="reveal-hide-description" />;
}
