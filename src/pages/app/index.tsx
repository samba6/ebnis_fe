import React from "react";
import { Router, RouteComponentProps } from "@reach/router";
import { AuthRequired } from "../../components/AuthRequired/auth-required.componnet";
import { EXPERIENCE_DEFINITION_URL, EXPERIENCES_URL } from "../../routes";
import { NotFound } from "../../components/NotFound";
import { Layout } from "../../components/Layout/layout.component";
import { EXPERIENCE_URL } from "../../constants/experience-route";
import { NEW_ENTRY_URL } from "../../constants/new-entry-route";
import Loadable from "react-loadable";
import { LoadableLoading } from "../../components/Loading/loading";

const ExperienceDefinition = Loadable({
  loader: () =>
    import(
      "../../components/ExperienceDefinition/experience-definition.component"
    ),
  loading: LoadableLoading,
});

const ExperienceNewEntryParent = Loadable({
  loader: () =>
    import(
      "../../components/ExperienceNewEntryParent/experience-new-entry-parent.component"
    ),
  loading: LoadableLoading,
});

const MyExperiences = Loadable({
  loader: () =>
    import("../../components/MyExperiences/my-experiences.component"),
  loading: LoadableLoading,
});

export function App(props: RouteComponentProps) {
  return (
    <Layout {...props}>
      <Router id="global-router">
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

        <NotFound default={true} />
      </Router>
    </Layout>
  );
}

export default App;
