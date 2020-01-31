import React, { useEffect } from "react";
import "./experience-route.styles.scss";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import Experience, { getTitle } from "../Experience/experience.component";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { IMenuOptions } from "../Experience/experience.utils";

export function ExperienceRoute(props: Props) {
  const { experience } = props;

  const title = getTitle(experience);

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(title));

      return setDocumentTitle;
    },
    [title],
  );

  return (
    <div className="components-experience-route">
      <SidebarHeader title={title} sidebar={true} />

      <div className="main">
        <Experience experience={experience} menuOptions={{} as IMenuOptions} />
      </div>
    </div>
  );
}

export default ExperienceRoute;

export interface Props {
  experience: ExperienceFragment;
}
