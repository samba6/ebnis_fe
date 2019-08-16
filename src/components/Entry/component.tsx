import React, { useMemo, CSSProperties, useReducer } from "react";
import { displayFieldType, formatDatetime } from "../Experience/utils";
import "./styles.scss";
import makeClassNames from "classnames";
import {
  ExperienceFragment_dataDefinitions,
  ExperienceFragment_entries_edges_node_dataObjects,
} from "../../graphql/apollo-types/ExperienceFragment";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import { Props, ActionTypes, reducer, DispatchType } from "./utils";
import {
  EntryFragment_dataObjects,
  EntryFragment,
} from "../../graphql/apollo-types/EntryFragment";
import { EditEntry } from "../EditEntry";

export function Entry(props: Props) {
  const { entry, definitions, className = "", ...fieldProps } = props;

  const [state, dispatch] = useReducer(reducer, {
    stateValue: "idle",
  });

  const containerId = props.id || `entry-container-${entry.id}`;

  const dataObjects = entry.dataObjects as ExperienceFragment_entries_edges_node_dataObjects[];
  const dataObjectsLen = dataObjects.length;

  const definitionsMap = useMemo(() => {
    return definitions.reduce(
      (acc, f) => {
        acc[f.id] = f;
        return acc;
      },
      {} as { [k: string]: ExperienceFragment_dataDefinitions },
    );
  }, [definitions]);

  return (
    <div
      className={makeClassNames({
        "component-experience-entry": true,
        [className]: !!className,
      })}
      id={containerId}
    >
      {state.stateValue === "editing" && (
        <EditEntry
          entry={entry}
          definitions={definitions}
          dispatch={dispatch}
        />
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
            entry={entry}
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
  entry: EntryFragment;
  dispatch: DispatchType;
}) {
  const { dataObject, definition, index, entry, dispatch } = props;

  const { definitionId, data } = dataObject;

  const { type, name: fieldName } = definition;

  const [fieldData] = Object.values(JSON.parse(data));
  const text = displayFieldType[type](fieldData);
  const { id: entryId } = entry;
  const entryIdPrefix = "entry-" + entryId;
  const definitionIdPrefix = entryIdPrefix + "-" + definitionId;

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
                {dispatch && (
                  <Dropdown.Header
                    id={`${entryIdPrefix}-edit-trigger`}
                    onClick={() => {
                      dispatch({
                        type: ActionTypes.editClicked,
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

        <div className="field__value" id={`${definitionIdPrefix}-value`}>
          {text}
        </div>
      </div>
    </div>
  );
}
