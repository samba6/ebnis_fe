import React from "react";
import { Router, RouteComponentProps } from "@reach/router";

import { AuthRequired } from "../../components/AuthRequired";
import { ExperienceDefinition } from "../../components/ExperienceDefinition";
import { NewEntry } from "../../components/NewEntry";
import {
  EXPERIENCE_DEFINITION_URL,
  NEW_ENTRY_URL,
  EXPERIENCES_URL
} from "../../routes";
import { NotFound } from "../../components/NotFound";
import { MyExperiences } from "../../components/MyExperiences";
import { Experience } from "../../components/Experience";
import { Layout } from "../../components/Layout";
import { EXPERIENCE_URL } from "../../constants/experience-route";

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
