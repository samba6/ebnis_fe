import React, { useEffect } from "react";
import "./experience-route.styles.scss";
import { Props } from "./experience-route.utils";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { Experience, getTitle } from "../Experience/experience.component";
import { UPDATE_EXPERIENCE_MUTATION } from "../../graphql/update-experience.mutation";
import {
  UpdateExperienceMutation,
  UpdateExperienceMutationVariables,
} from "../../graphql/apollo-types/UpdateExperienceMutation";
import { useMutation } from "@apollo/react-hooks";

export function ExperienceRoute(props: Props) {
  const { experience } = props;

  const [updateExperience] = useMutation<
    UpdateExperienceMutation,
    UpdateExperienceMutationVariables
  >(UPDATE_EXPERIENCE_MUTATION);

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

export default ExperienceRoute;
