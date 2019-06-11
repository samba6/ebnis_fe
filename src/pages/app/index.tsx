import React from "react";
import { Router, RouteComponentProps } from "@reach/router";

import { AuthRequired } from "../../components/AuthRequired";
import { EXPERIENCE_DEFINITION_URL, EXPERIENCES_URL } from "../../routes";
import { NotFound } from "../../components/NotFound";
import { Layout } from "../../components/Layout";
import { EXPERIENCE_URL } from "../../constants/experience-route";
import { NEW_ENTRY_URL } from "../../constants/new-entry-route";
import Loadable from "react-loadable";
import { Loading } from "../../components/Loading";

const ExperienceDefinition = Loadable({
  loader: () => import("../../components/ExperienceDefinition"),
  loading: Loading
});

const NewEntry = Loadable({
  loader: () => import("../../components/NewEntry"),
  loading: Loading
});

const MyExperiences = Loadable({
  loader: () => import("../../components/MyExperiences"),
  loading: Loading
});

const Experience = Loadable({
  loader: () => import("../../components/Experience"),
  loading: Loading
});

export function App(props: RouteComponentProps) {
  return (
    <Layout>
      <Router style={{ height: "100%" }}>
        <AuthRequired
          path={EXPERIENCE_DEFINITION_URL}
          component={ExperienceDefinition}
        />

        <AuthRequired path={EXPERIENCE_URL} component={Experience} />

        <AuthRequired path={NEW_ENTRY_URL} component={NewEntry} />

        <AuthRequired path={EXPERIENCES_URL} component={MyExperiences} />

        <NotFound default={true} />
      </Router>
    </Layout>
  );
}

export default App;
