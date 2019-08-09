import React, { useMemo, CSSProperties } from "react";
import { displayFieldType, formatDatetime } from "../Experience/utils";
import "./styles.scss";
import makeClassNames from "classnames";
import {
  ExperienceFragment_dataDefinitions,
  ExperienceFragment_entries_edges_node_dataObjects,
} from "../../graphql/apollo-types/ExperienceFragment";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import { Props, EntryActionTypes } from "./utils";
import {
  EntryFragment_dataObjects,
  EntryFragment,
} from "../../graphql/apollo-types/EntryFragment";

export function Entry(props: Props) {
  const {
    entry,
    dataDefinitions: fieldDefs,
    className = "",
    ...fieldProps
  } = props;
  const containerId = props.id || `entry-container-${entry.id}`;

  const dataObjects = entry.dataObjects as ExperienceFragment_entries_edges_node_dataObjects[];
  const fieldsLen = dataObjects.length;

  const fieldDefsMap = useMemo(() => {
    return fieldDefs.reduce(
      (acc, f) => {
        acc[f.id] = f;
        return acc;
      },
      {} as { [k: string]: ExperienceFragment_dataDefinitions },
    );
  }, [fieldDefs]);

  return (
    <div
      className={makeClassNames({
        "component-experience-entry": true,
        [className]: !!className,
      })}
      id={containerId}
    >
      {dataObjects.map((dataObject, fieldIndex) => {
        const fieldDef = fieldDefsMap[dataObject.definitionId];

        return (
          <FieldComponent
            {...fieldProps}
            key={dataObject.definitionId + fieldIndex}
            field={dataObject}
            fieldDef={fieldDef}
            index={fieldIndex}
            fieldsLen={fieldsLen}
            entry={entry}
          />
        );
      })}

      <div className="meta">
        <div className="entry__timestamps">
          <div>Created: {formatDatetime(entry.insertedAt)}</div>

          <div>Updated: {formatDatetime(entry.updatedAt)}</div>
        </div>
      </div>
    </div>
  );
}

function FieldComponent(
  props: Pick<Props, "dispatch" | "editable"> & {
    field: EntryFragment_dataObjects;
    fieldDef: ExperienceFragment_dataDefinitions;
    index: number;
    fieldsLen: number;
    entry: EntryFragment;
  },
) {
  const { field, fieldDef, index, entry, editable, dispatch } = props;

  const { definitionId, data } = field;

  const { type, name: fieldName } = fieldDef;

  const [fieldData] = Object.values(JSON.parse(data));
  const text = displayFieldType[type](fieldData);
  const { id: entryId } = entry;

  return (
    <div
      key={definitionId}
      className={makeClassNames({
        field: true,
      })}
    >
      <div className="field__content">
        <div className="field__header">
          <span className="field__name">
            {fieldName[0].toUpperCase() + fieldName.slice(1)}
          </span>

          {index === 0 && (
            <Dropdown
              className="field__options"
              icon="ellipsis vertical"
              direction="left"
            >
              <Dropdown.Menu>
                {editable && dispatch && (
                  <Dropdown.Header
                    id={`entry-${entryId}-edit-trigger`}
                    onClick={() => {
                      dispatch([EntryActionTypes.editClicked, entry]);
                    }}
                    style={
                      {
                        cursor: "pointer",
                      } as CSSProperties
                    }
                  >
                    <Icon name="pencil" />
                    <span style={{ marginLeft: "8px" }}>Edit</span>
                  </Dropdown.Header>
                )}

                <Dropdown.Menu scrolling={true}>
                  <Dropdown.Item
                    text="Delete"
                    value="Delete"
                    label={{ color: "red", empty: true, circular: true }}
                  />
                </Dropdown.Menu>
              </Dropdown.Menu>
            </Dropdown>
          )}
        </div>

        <div className="field__value" id={`${entryId}-value-${definitionId}`}>
          {text}
        </div>
      </div>
    </div>
  );
}
