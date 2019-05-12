import React, { useEffect, useMemo } from "react";
import { Button } from "semantic-ui-react";
import { NavigateFn } from "@reach/router";

import "./styles.scss";
import { Props, displayFieldType } from "./utils";
import { setTitle, makeNewEntryRoute } from "../../routes";
import Loading from "../Loading";
import {
  GetExpAllEntries_expEntries,
  GetExpAllEntries_expEntries_fields
} from "../../graphql/apollo-types/GetExpAllEntries";
import { GetAnExp_exp_fieldDefs } from "../../graphql/apollo-types/GetAnExp";

export const Experience = (props: Props) => {
  const {
    loading,
    getExperienceGql: { exp },
    expEntries,
    navigate,
    SidebarHeader
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
      setTitle(title);

      return setTitle;
    },
    [title]
  );

  function goToNewEntry() {
    (navigate as NavigateFn)(makeNewEntryRoute((exp && exp.id) || ""));
  }

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
        <span className="no-entries" onClick={goToNewEntry}>
          No entries. Click here to add one
        </span>
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

          <Button
            className="new-exp-entry-button"
            type="button"
            name="new-exp-entry-button"
            basic={true}
            compact={true}
            onClick={goToNewEntry}
          >
            New entry
          </Button>
        </div>

        <div className="main">{renderEntries()}</div>
      </>
    );
  }

  const render = (
    <div className="app-container">
      <SidebarHeader title={title} sidebar={true} />

      <div className="app-main routes-exp">{renderMainOr()}</div>
    </div>
  );

  return render;
};
