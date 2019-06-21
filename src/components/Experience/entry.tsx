import React, { Fragment } from "react";
import {
  GetAnExp_exp_entries_edges_node,
  GetAnExp_exp_fieldDefs,
  GetAnExp_exp_entries_edges_node_fields
} from "../../graphql/apollo-types/GetAnExp";
import { displayFieldType } from "./utils";
import "./entry-styles.scss";

export function Entry({
  entry,
  fieldDefs
}: {
  entry: GetAnExp_exp_entries_edges_node;
  fieldDefs: GetAnExp_exp_fieldDefs[];
}) {
  function renderEntryField(field: GetAnExp_exp_entries_edges_node_fields) {
    const { defId, data } = field;

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

  return (
    <div className="component-experience-entry" data-testid="entry-container">
      {(entry.fields as GetAnExp_exp_entries_edges_node_fields[]).map(
        renderEntryField
      )}
    </div>
  );
}
