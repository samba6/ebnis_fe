import React, { useEffect, Fragment } from "react";
import { Button } from "semantic-ui-react";
import { Link } from "gatsby";

import "./styles.scss";
import { Props, displayFieldType } from "./utils";
import { Loading } from "../Loading";
import {
  GetAnExp_exp_fieldDefs,
  GetAnExp_exp_entries,
  GetAnExp_exp_entries_edges,
  GetAnExp_exp_entries_edges_node,
  GetAnExp_exp_entries_edges_node_fields
} from "../../graphql/apollo-types/GetAnExp";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { GetExperienceGqlValues } from "../../graphql/get-exp.query";
import { UnsavedExperienceDataValue } from "./resolvers";
import { makeNewEntryRoute } from "../../constants/new-entry-route";
import { useManualUnsavedExperience } from "./use-manual-unsaved-experience";
import { useGoto404OnExperienceNotFound } from "./use-goto-404";
export function Experience(props: Props) {
  const {
    getExperienceGql: {
      loading: loadingExperience
    } = {} as GetExperienceGqlValues,

    unsavedExperienceGql: {
      loading: loadingUnsavedExperience
    } = {} as UnsavedExperienceDataValue
  } = props;

  const {
    experienceToRender,
    loadingUnsavedExperienceForState
  } = useManualUnsavedExperience(props);

  const loading =
    loadingExperience ||
    loadingUnsavedExperience ||
    loadingUnsavedExperienceForState;

  const title = getTitle(experienceToRender);

  useGoto404OnExperienceNotFound(props, loading, experienceToRender);

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(title));

      return setDocumentTitle;
    },
    [title]
  );

  function renderEntryField(field: GetAnExp_exp_entries_edges_node_fields) {
    const { defId, data } = field;

    const fieldDefs = experienceToRender.fieldDefs as GetAnExp_exp_fieldDefs[];

    const fieldDef = fieldDefs.find(
      (aFieldDef: GetAnExp_exp_fieldDefs) => aFieldDef.id === defId
    );

    // istanbul ignore next: impossible state?
    if (!fieldDef) {
      return;
    }

    const { type, name: fieldName } = fieldDef;

    const [fieldData] = Object.values(JSON.parse(data));
    const text = displayFieldType[type](fieldData);

    return (
      <Fragment key={defId}>
        {fieldName} {text}
      </Fragment>
    );
  }

  function renderEntries() {
    const entries = experienceToRender.entries as GetAnExp_exp_entries;
    const edges = entries.edges as GetAnExp_exp_entries_edges[];

    if (edges.length === 0) {
      return (
        <Link
          className="no-entries"
          data-testid="no-entries"
          to={makeNewEntryRoute(experienceToRender.id)}
        >
          No entries. Click here to add one
        </Link>
      );
    }

    return (
      <>
        {edges.map((edge: GetAnExp_exp_entries_edges) => {
          const entry = edge.node as GetAnExp_exp_entries_edges_node;

          return (
            <div
              key={entry.id}
              className="entry-container"
              data-testid="entry-container"
            >
              {(entry.fields as GetAnExp_exp_entries_edges_node_fields[]).map(
                renderEntryField
              )}
            </div>
          );
        })}
      </>
    );
  }

  function renderMain() {
    if (loading) {
      return <Loading loading={loading} />;
    }

    if (!experienceToRender) {
      return null;
    }

    return (
      <>
        <div className="header" data-testid="experience-entries">
          <div className="title">{title}</div>

          <div className="new-experience-entry-button">
            <Button
              type="button"
              data-testid="new-exp-entry-button"
              basic={true}
              compact={true}
              as={Link}
              to={makeNewEntryRoute(experienceToRender.id)}
            >
              New entry
            </Button>
          </div>
        </div>

        {renderEntries()}
      </>
    );
  }
  return (
    <div className="components-experience">
      <SidebarHeader title={title} sidebar={true} />

      <div className="main">{renderMain()}</div>
    </div>
  );
}

function getTitle(arg?: { title: string }) {
  return arg ? arg.title : "Experience";
}
