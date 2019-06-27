import React, { useEffect } from "react";

import "./styles.scss";
import { Props } from "./utils";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { Experience, getTitle } from "../Experience/component";

export function ExperienceRoute(props: Props) {
  const { experience } = props;

  const title = getTitle(experience);

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(title));

      return setDocumentTitle;
    },
    [title]
  );

  return (
    <div className="components-experience-route">
      <SidebarHeader title={title} sidebar={true} />

      <div className="main">
        <Experience experience={experience} />
      </div>
    </div>
  );
}
