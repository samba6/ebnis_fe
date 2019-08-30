import React from "react";
import { Router, RouteComponentProps } from "@reach/router";

import { AuthRequired } from "../../components/AuthRequired";
import { EXPERIENCE_DEFINITION_URL, EXPERIENCES_URL } from "../../routes";
import { NotFound } from "../../components/NotFound";
import { Layout } from "../../components/Layout/layout";
import { EXPERIENCE_URL } from "../../constants/experience-route";
import { NEW_ENTRY_URL } from "../../constants/new-entry-route";
import Loadable from "react-loadable";
import { LoadableLoading } from "../../components/Loading/loading";
import { UPLOAD_UNSAVED_PREVIEW_URL } from "../../constants/upload-unsaved-routes";

const ExperienceDefinition = Loadable({
  loader: () =>
    import("../../components/ExperienceDefinition/experience-definition"),
  loading: LoadableLoading,
});

const ExperienceNewEntryParent = Loadable({
  loader: () =>
    import("../../components/ExperienceNewEntryParent/experience-new-entry"),
  loading: LoadableLoading,
});

const MyExperiences = Loadable({
  loader: () => import("../../components/MyExperiences/my-experiences"),
  loading: LoadableLoading,
});

const UploadUnsaved = Loadable({
  loader: () => import("../../components/UploadUnsaved/upload-unsaved"),
  loading: LoadableLoading,
});

export function App(props: RouteComponentProps) {
  return (
    <Layout {...props}>
      <Router id="global-router" >
        <AuthRequired
          path={EXPERIENCE_DEFINITION_URL}
          component={ExperienceDefinition}
        />

        <AuthRequired
          path={NEW_ENTRY_URL}
          component={ExperienceNewEntryParent}
        />

        <AuthRequired
          path={EXPERIENCE_URL}
          component={ExperienceNewEntryParent}
        />

        <AuthRequired path={EXPERIENCES_URL} component={MyExperiences} />

        <AuthRequired
          path={UPLOAD_UNSAVED_PREVIEW_URL}
          component={UploadUnsaved}
        />

        <NotFound default={true} />
      </Router>
    </Layout>
  );
}

export default App;
