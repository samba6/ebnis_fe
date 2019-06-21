import React from "react";
import { Router, RouteComponentProps } from "@reach/router";

import { AuthRequired } from "../../components/AuthRequired";
import { EXPERIENCE_DEFINITION_URL, EXPERIENCES_URL } from "../../routes";
import { NotFound } from "../../components/NotFound";
import { Layout } from "../../components/Layout";
import { EXPERIENCE_URL } from "../../constants/experience-route";
import { NEW_ENTRY_URL } from "../../constants/new-entry-route";
import Loadable from "react-loadable";
import { LoadableLoading } from "../../components/Loading";
import { SYNC_PREVIEW_URL } from "../../constants/sync-routes";

const ExperienceDefinition = Loadable({
  loader: () => import("../../components/ExperienceDefinition"),
  loading: LoadableLoading
});

const ExperienceNewEntryParent = Loadable({
  loader: () => import("../../components/ExperienceNewEntryParent"),
  loading: LoadableLoading
});

const MyExperiences = Loadable({
  loader: () => import("../../components/MyExperiences"),
  loading: LoadableLoading
});

const Sync = Loadable({
  loader: () => import("../../components/Sync"),
  loading: LoadableLoading
});

export function App(props: RouteComponentProps) {
  return (
    <Layout>
      <Router style={{ height: "100%" }}>
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

        <AuthRequired path={SYNC_PREVIEW_URL} component={Sync} />

        <NotFound default={true} />
      </Router>
    </Layout>
  );
}

export default App;
