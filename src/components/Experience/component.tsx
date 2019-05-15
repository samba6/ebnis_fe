import React, { useEffect, useMemo } from "react";
import { Button } from "semantic-ui-react";
import { Link } from "gatsby";

import "./styles.scss";
import { Props, displayFieldType } from "./utils";
import { makeNewEntryRoute } from "../../routes";
import Loading from "../Loading";
import {
  GetExpAllEntries_expEntries,
  GetExpAllEntries_expEntries_fields
} from "../../graphql/apollo-types/GetExpAllEntries";
import {
  GetAnExp_exp_fieldDefs,
  GetAnExp_exp
} from "../../graphql/apollo-types/GetAnExp";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";

export function Experience(props: Props) {
  const {
    loading,
    getExperienceGql: { exp },
    expEntries
  } = props;
  const title = exp ? exp.title : "Experience";

  const fieldDefs = useMemo(
    function computeFieldDefs() {
      return (exp && exp.fieldDefs) || [];
    },
    [exp]
  );

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(title));

      return setDocumentTitle;
    },
    [title]
  );

  function renderEntryField(field: GetExpAllEntries_expEntries_fields | null) {
    if (!field) {
      return null;
    }

    const { defId, data } = field;
    const fieldDef = fieldDefs.find((f: GetAnExp_exp_fieldDefs | null) =>
      f ? f.id === defId : false
    );

    if (!fieldDef) {
      return;
    }

    const { type, name: fieldName } = fieldDef;

    const [fieldData] = Object.values(JSON.parse(data));
    const text = displayFieldType[type](fieldData);

    return (
      <div key={defId}>
        {fieldName} {text}
      </div>
    );
  }

  function renderEntry(
    entry: GetExpAllEntries_expEntries | null,
    index: number
  ) {
    if (!entry) {
      return null;
    }

    const { fields } = entry;

    return (
      <div key={index} className="entry-container">
        {fields.map(renderEntryField)}
      </div>
    );
  }

  function renderEntries() {
    if (!(expEntries && expEntries.length)) {
      return (
        <Link
          className="no-entries"
          to={makeNewEntryRoute((exp as GetAnExp_exp).id)}
        >
          No entries. Click here to add one
        </Link>
      );
    }

    return <>{expEntries.map(renderEntry)}</>;
  }

  function renderMainOr() {
    if (loading) {
      return <Loading />;
    }

    return (
      <>
        <div className="header">
          <div className="title">{title}</div>

          <div className="new-experience-entry-button">
            <Button
              type="button"
              name="new-exp-entry-button"
              basic={true}
              compact={true}
              as={Link}
              to={makeNewEntryRoute((exp as GetAnExp_exp).id)}
            >
              New entry
            </Button>
          </div>
        </div>

        {renderEntries()}
      </>
    );
  }

  const render = (
    <div className="components-experience">
      <SidebarHeader title={title} sidebar={true} />

      <div className="main">{renderMainOr()}</div>
    </div>
  );

  return render;
}
