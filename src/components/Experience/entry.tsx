import React from "react";
import { displayFieldType, formatDatetime } from "./utils";
import "./entry-styles.scss";
import makeClassNames from "classnames";
import {
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_fieldDefs,
  ExperienceFragment_entries_edges_node_fields
} from "../../graphql/apollo-types/ExperienceFragment";

export function Entry({
  entry,
  fieldDefs,
  entriesLen,
  index,
  className = ""
}: {
  entry: ExperienceFragment_entries_edges_node;
  fieldDefs: ExperienceFragment_fieldDefs[];
  entriesLen: number;
  index: number;
  className?: string;
}) {
  const fields = entry.fields as ExperienceFragment_entries_edges_node_fields[];
  const fieldsLen = fields.length;

  return (
    <div
      className={makeClassNames({
        "component-experience-entry": true,
        [className]: !!className
      })}
      data-testid="entry-container"
    >
      {fields.map((field, fieldIndex) => {
        return (
          <FieldComponent
            key={field.defId + fieldIndex}
            field={field}
            fieldDefs={fieldDefs}
            index={fieldIndex}
            fieldsLen={fieldsLen}
          />
        );
      })}

      <div className="meta">
        <div className="inserted-at">
          created: {formatDatetime(entry.insertedAt)}
        </div>
        <div className="updated-at">
          updated: {formatDatetime(entry.updatedAt)}
        </div>
      </div>
    </div>
  );
}

function FieldComponent({
  field,
  fieldDefs,
  index,
  fieldsLen
}: {
  field: ExperienceFragment_entries_edges_node_fields;
  fieldDefs: ExperienceFragment_fieldDefs[];
  index: number;
  fieldsLen: number;
}) {
  const { defId, data } = field;

  const fieldDef = fieldDefs.find(
    (aFieldDef: ExperienceFragment_fieldDefs) => aFieldDef.id === defId
  );

  // istanbul ignore next: impossible state?
  if (!fieldDef) {
    return null;
  }

  const { type, name: fieldName } = fieldDef;

  const [fieldData] = Object.values(JSON.parse(data));
  const text = displayFieldType[type](fieldData);

  return (
    <div
      key={defId}
      className={makeClassNames({
        field: true,
        "field--last": index === fieldsLen - 1
      })}
    >
      <span className="field-name">
        {fieldName[0].toUpperCase() + fieldName.slice(1)}:
      </span>
      {text}
    </div>
  );
}
