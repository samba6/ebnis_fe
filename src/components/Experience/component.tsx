import React, { useMemo } from "react";
import Card from "semantic-ui-react/dist/commonjs/views/Card";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import { Link } from "gatsby";

import "./styles.scss";
import { Props } from "./utils";
import { makeNewEntryRoute } from "../../constants/new-entry-route";
import { Entry } from "../Entry/component";
import {
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_fieldDefs,
  ExperienceFragment
} from "../../graphql/apollo-types/ExperienceFragment";
import makeClassNames from "classnames";

export function Experience(props: Props) {
  const {
    navigate,
    experience,
    className = "",
    entryProps = {},
    headerProps = {},
    menuOptions = {},
    entryNodes: defaultEntryNodes,
    doNotShowNoEntriesLink,
    children,
    ...otherProps
  } = props;

  const entryNodes = useMemo(() => {
    if (defaultEntryNodes) {
      return defaultEntryNodes;
    }

    const entries = experience.entries as ExperienceFragment_entries;
    const edges = entries.edges as ExperienceFragment_entries_edges[];

    return edges.map(
      (edge: ExperienceFragment_entries_edges) =>
        edge.node as ExperienceFragment_entries_edges_node
    );
  }, [experience, defaultEntryNodes]);

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
            />
          );
        })}
      </>
    );
  }

  return (
    <Card
      className={makeClassNames({
        "components-experience": true,
        [className]: !!className
      })}
      {...otherProps}
    >
      <Card.Content className="experience__header" {...headerProps}>
        <Card.Header>
          <span>{getTitle(experience)}</span>

          <div className="options-menu-container">
            <OptionsMenuComponent experience={experience} {...menuOptions} />
          </div>
        </Card.Header>

        <>{headerProps.children}</>
      </Card.Content>

      {children}

      {!doNotShowNoEntriesLink && (
        <Card.Content className="experience__main">
          {renderEntries()}
        </Card.Content>
      )}
    </Card>
  );
}

function OptionsMenuComponent({
  experience,
  newEntry = true
}: {
  experience: ExperienceFragment;
} & Props["menuOptions"]) {
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
          <Dropdown.Header data-testid="new-experience-entry-button">
            <Icon name="external alternate" />
            <Link to={makeNewEntryRoute(experience.id)}>New Entry</Link>
          </Dropdown.Header>
        )}

        <Dropdown.Menu scrolling={true}>
          <Dropdown.Item
            text="Delete"
            value="Delete"
            label={{ color: "red", empty: true, circular: true }}
          />

          <Dropdown.Item
            text="Announcement"
            value="Announcement"
            label={{ color: "blue", empty: true, circular: true }}
          />
        </Dropdown.Menu>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export function getTitle(arg?: { title: string }) {
  return arg ? arg.title : "Experience";
}
