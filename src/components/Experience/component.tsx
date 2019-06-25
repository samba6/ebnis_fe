import React, { useEffect } from "react";
import { Button } from "semantic-ui-react";
import { Link } from "gatsby";

import "./styles.scss";
import { Props } from "./utils";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { makeNewEntryRoute } from "../../constants/new-entry-route";
import { Entry } from "./entry";
import {
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_fieldDefs
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

  function renderMain() {
    return (
      <>
        <div className="header" data-testid="experience-entries">
          <div className="title">{title}</div>

          <div className="new-experience-entry-button">
            <Button
              type="button"
              data-testid="new-exp-entry-button"
              basic={true}
              compact={true}
              as={Link}
              to={makeNewEntryRoute(experience.id)}
            >
              New entry
            </Button>
          </div>
        </div>

        {renderEntries()}
      </>
    );
  }
  return (
    <div className="components-experience">
      <SidebarHeader title={title} sidebar={true} />

      <div className="main">{renderMain()}</div>
    </div>
  );
}

function getTitle(arg?: { title: string }) {
  return arg ? arg.title : "Experience";
}
