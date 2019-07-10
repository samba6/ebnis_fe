import React, { useMemo, useReducer } from "react";
import Card from "semantic-ui-react/dist/commonjs/views/Card";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import { Link } from "gatsby";

import "./styles.scss";
import {
  Props,
  IMenuOptions,
  reducer,
  DispatchType,
  EditingState,
} from "./utils";
import { makeNewEntryRoute } from "../../constants/new-entry-route";
import { Entry } from "../Entry/component";
import {
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_fieldDefs,
  ExperienceFragment,
} from "../../graphql/apollo-types/ExperienceFragment";
import makeClassNames from "classnames";
import { EditExperience } from "../EditExperience/component";
import { EditEntry } from "../EditEntry/component";

export function Experience(props: Props) {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    navigate,
    experience,
    className = "",
    entryProps = {},
    headerProps = {},
    menuOptions = {} as IMenuOptions,
    children,
    entriesJSX,
    updateEntry,
    ...otherProps
  } = props;

  const { onEdit } = menuOptions;

  const [state, dispatch] = useReducer(reducer, {
    editingState: [EditingState.notEditing],
  });
  const { editingState } = state;
  const [editingStateTag] = editingState;

  const entryNodes = useMemo(() => {
    if (entriesJSX) {
      return [];
    }

    const entries = experience.entries as ExperienceFragment_entries;
    const edges = entries.edges as ExperienceFragment_entries_edges[];

    return edges.map(
      (edge: ExperienceFragment_entries_edges) =>
        edge.node as ExperienceFragment_entries_edges_node,
    );
  }, [experience, entriesJSX]);

  function renderEntries() {
    const nodesLen = entryNodes.length;

    if (nodesLen === 0) {
      return (
        <Link
          className="no-entries"
          data-testid="no-entries"
          to={makeNewEntryRoute(experience.id)}
        >
          No entries. Click here to add one
        </Link>
      );
    }

    return (
      <>
        {entryNodes.map((entryNode, index) => {
          return (
            <Entry
              key={entryNode.id}
              entry={entryNode}
              fieldDefs={experience.fieldDefs as ExperienceFragment_fieldDefs[]}
              entriesLen={nodesLen}
              index={index}
              {...entryProps}
              editable={!!updateEntry}
              dispatch={dispatch}
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      <Card
        className={makeClassNames({
          "components-experience": true,
          [className]: !!className,
        })}
        {...otherProps}
      >
        <Card.Content className="experience__header" {...headerProps}>
          <Card.Header>
            <span>{getTitle(experience)}</span>

            <div className="options-menu-container">
              <OptionsMenuComponent
                experience={experience}
                dispatch={dispatch}
                {...menuOptions}
              />
            </div>
          </Card.Header>

          <>{headerProps.children}</>
        </Card.Content>

        {children}

        <Card.Content className="experience__main">
          {entriesJSX || renderEntries()}
        </Card.Content>
      </Card>

      {onEdit && editingStateTag === EditingState.editingExperience && (
        <EditExperience
          experience={experience}
          onEdit={onEdit}
          dispatch={dispatch}
        />
      )}

      {editingStateTag === EditingState.editingEntry && <EditEntry />}
    </>
  );
}

function OptionsMenuComponent({
  experience,
  newEntry = true,
  onDelete,
  onEdit,
  dispatch,
}: Props["menuOptions"] & {
  experience: ExperienceFragment;
  dispatch: DispatchType;
}) {
  const { id } = experience;
  const experienceIdPrefix = `experience-${id}`;

  return (
    <Dropdown
      text="OPTIONS"
      icon="ellipsis vertical"
      floating={true}
      labeled={true}
      button={true}
      className="icon options-menu__trigger"
      data-testid="experience-options-menu"
      direction="left"
    >
      <Dropdown.Menu>
        {newEntry && (
          <Dropdown.Header
            style={{
              display: "block",
            }}
            data-testid={`${experienceIdPrefix}-new-entry-button`}
            className="header"
            as={Link}
            to={makeNewEntryRoute(id)}
          >
            <Icon name="external alternate" />
            New Entry
          </Dropdown.Header>
        )}

        <Dropdown.Menu scrolling={true}>
          {onEdit && (
            <Dropdown.Item
              text="Edit"
              value="Edit"
              label={{ color: "blue", empty: true, circular: true }}
              className="js-edit-menu"
              onClick={() => dispatch(["show-editor"])}
            />
          )}

          <Dropdown.Item
            text="Delete"
            value="Delete"
            label={{ color: "red", empty: true, circular: true }}
            data-testid={`${experienceIdPrefix}-delete-button`}
            onClick={() => {
              onDelete(id);
            }}
          />
        </Dropdown.Menu>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export function getTitle(arg?: { title: string }) {
  return arg ? arg.title : "Experience";
}
