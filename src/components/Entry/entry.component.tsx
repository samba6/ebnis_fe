import React, { useMemo, CSSProperties, useReducer, Fragment } from "react";
import {
  displayFieldType,
  formatDatetime,
} from "../Experience/experience.utils";
import "./entry.styles.scss";
import makeClassNames from "classnames";
import {
  ExperienceFragment_dataDefinitions,
  ExperienceFragment_entries_edges_node_dataObjects,
} from "../../graphql/apollo-types/ExperienceFragment";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import { Props, ActionType, reducer, DispatchType } from "./entry.utils";
import { EntryFragment_dataObjects } from "../../graphql/apollo-types/EntryFragment";
import { EditEntry } from "../EditEntry/edit-entry.component";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";
import { isOfflineId } from "../../constants";
import {
  entryValueDomSelector,
  entryOptionsSelector,
  entryEditMenuItemSelector,
} from "./entry.dom";

export function Entry(props: Props) {
  const { entry, experience, className = "", ...fieldProps } = props;
  const { id: entryId, modOffline } = entry;
  const isOffline = isOfflineId(entryId);
  const isPartOffline = !isOffline && modOffline;
  const isOnline = !isOffline && !modOffline;
  const definitions = experience.dataDefinitions as DataDefinitionFragment[];

  const [state, dispatch] = useReducer(reducer, {
    stateValue: "idle",
  });

  const containerId = props.id || `entry-container-${entry.id}`;

  const dataObjects = entry.dataObjects as ExperienceFragment_entries_edges_node_dataObjects[];
  const dataObjectsLen = dataObjects.length;

  const definitionsMap = useMemo(() => {
    return definitions.reduce((acc, f) => {
      acc[f.id] = f;
      return acc;
    }, {} as { [k: string]: ExperienceFragment_dataDefinitions });
  }, [definitions]);

  return (
    <div
      className={makeClassNames({
        "component-experience-entry border-solid border-2": true,
        "border-blue-400": isOnline,
        "border-offline": isOffline,
        "border-part-offline": isPartOffline,
        [className]: !!className,
      })}
      id={containerId}
    >
      {state.stateValue === "editing" && (
        <EditEntry entry={entry} experience={experience} dispatch={dispatch} />
      )}

      {dataObjects.map((dataObject, index) => {
        const definition = definitionsMap[dataObject.definitionId];

        return (
          <DataComponent
            {...fieldProps}
            key={dataObject.definitionId + index}
            dataObject={dataObject}
            definition={definition}
            index={index}
            dataObjectsLen={dataObjectsLen}
            dispatch={dispatch}
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

function DataComponent(props: {
  dataObject: EntryFragment_dataObjects;
  definition: ExperienceFragment_dataDefinitions;
  index: number;
  dataObjectsLen: number;
  dispatch: DispatchType;
}) {
  const { dataObject, definition, index, dispatch } = props;
  const { definitionId, data } = dataObject;
  const { type, name: fieldName } = definition;
  const [fieldData] = Object.values(JSON.parse(data));
  const text = displayFieldType[type](fieldData as string);

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
              className={makeClassNames({
                field__options: true,
                [entryOptionsSelector]: true,
              })}
              icon="ellipsis vertical"
              direction="left"
            >
              <Dropdown.Menu>
                {dispatch && (
                  <Dropdown.Header
                    className={entryEditMenuItemSelector}
                    onClick={() => {
                      dispatch({
                        type: ActionType.editClicked,
                      });
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

        <div
          className={makeClassNames({
            "mr-2 field__value": true,
            [entryValueDomSelector]: true,
          })}
        >
          {(text + "").split("\\n").map((t, index) => (
            <Fragment key={index}>
              {t}
              <br />
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
