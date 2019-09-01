import React, { useEffect } from "react";
import "./experience-route.styles.scss";
import { Props } from "./experience-route.utils";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { Experience, getTitle } from "../Experience/experience.component";

export function ExperienceRoute(props: Props) {
  const { experience, updateExperience } = props;

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
        <Experience
          experience={experience}
          menuOptions={{
            onDelete: () => {},
            onEdit: updateExperience,
          }}
        />
      </div>
    </div>
  );
}
