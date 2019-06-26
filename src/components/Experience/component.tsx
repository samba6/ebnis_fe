import React, { useEffect } from "react";
import Card from "semantic-ui-react/dist/commonjs/views/Card";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import { Link } from "gatsby";

import "./styles.scss";
import { Props } from "./utils";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { makeNewEntryRoute } from "../../constants/new-entry-route";
import { Entry } from "../Entry/component";
import {
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_fieldDefs,
  ExperienceFragment
} from "../../graphql/apollo-types/ExperienceFragment";

export function Experience(props: Props) {
  const { experience } = props;

  const title = getTitle(experience);

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(title));

      return setDocumentTitle;
    },
    [title]
  );

  function renderEntries() {
    const entries = experience.entries as ExperienceFragment_entries;
    const edges = entries.edges as ExperienceFragment_entries_edges[];
    const edgesLen = edges.length;

    if (edgesLen === 0) {
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
        {edges.map((edge: ExperienceFragment_entries_edges, index) => {
          const entry = edge.node as ExperienceFragment_entries_edges_node;

          return (
            <Entry
              key={entry.id}
              entry={entry}
              fieldDefs={experience.fieldDefs as ExperienceFragment_fieldDefs[]}
              entriesLen={edgesLen}
              index={index}
            />
          );
        })}
      </>
    );
  }

  return (
    <div className="components-experience">
      <SidebarHeader title={title} sidebar={true} />

      <Card className="main">
        <Card.Content className="experience__header">
          <Card.Header>
            <span>{title}</span>

            <div className="options-menu-container">
              <OptionsMenuComponent experience={experience} />
            </div>
          </Card.Header>
        </Card.Content>

        <Card.Content className="experience__main">
          {renderEntries()}
        </Card.Content>
      </Card>
    </div>
  );
}

function getTitle(arg?: { title: string }) {
  return arg ? arg.title : "Experience";
}

function OptionsMenuComponent({
  experience
}: {
  experience: ExperienceFragment;
}) {
  return (
    <Dropdown
      text="OPTIONS"
      icon="ellipsis vertical"
      floating={true}
      labeled={true}
      button={true}
      className="icon options-menu__trigger"
      data-testid="experience-options-menu"
    >
      <Dropdown.Menu>
        <Dropdown.Header data-testid="new-experience-entry-button">
          <Icon name="external alternate" />
          <Link to={makeNewEntryRoute(experience.id)}>New Entry</Link>
        </Dropdown.Header>

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
