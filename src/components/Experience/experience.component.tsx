import React, { useMemo, useReducer, useContext } from "react";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import { Link } from "../Link";
import "./experience.styles.scss";
import {
  Props,
  IMenuOptions,
  reducer,
  DispatchType,
  ActionType,
  CallerProps,
  initState,
  StateValue,
} from "./experience.utils";
import { makeNewEntryRoute } from "../../constants/new-entry-route";
import { Entry } from "../Entry/entry.component";
import {
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment,
} from "../../graphql/apollo-types/ExperienceFragment";
import makeClassNames from "classnames";
import { EditExperience } from "./loadables";
import { isOfflineId } from "../../constants";
import { LayoutContext } from "../Layout/layout.utils";

export function ExperienceComponent(props: Props) {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    navigate,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateExperiencesOnline,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hasConnection,
    experience,
    className = "",
    entryProps = {},
    headerProps = {},
    menuOptions = {} as IMenuOptions,
    children,
    entriesJSX,
    ...otherProps
  } = props;

  const [stateMachine, dispatch] = useReducer(reducer, undefined, initState);
  const {
    states: { editingExperience: editingExperienceState },
  } = stateMachine;

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
          id="experience-no-entries"
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
              experience={experience}
              entriesLen={nodesLen}
              index={index}
              {...entryProps}
            />
          );
        })}
      </>
    );
  }

  const { id, hasUnsaved, title } = experience;
  const isOffline = isOfflineId(id);
  const isPartOffline = !isOffline && hasUnsaved;
  const isOnline = !isOffline && !hasUnsaved;

  return (
    <>
      <div
        className={makeClassNames({
          "components-experience border-solid border-2 rounded": true,
          [className]: !!className,
          "border-blue-400": isOnline,
          "border-offline": isOffline,
          "border-part-offline": isPartOffline,
        })}
        id={id}
        {...otherProps}
      >
        <div className="experience__header" {...headerProps}>
          <div className="mt-1 ml-1 font-bold">{title}</div>

          <div>
            <div className="options-menu-container">
              <OptionsMenuComponent
                experience={experience}
                dispatch={dispatch}
                {...menuOptions}
              />
            </div>
          </div>

          <>{headerProps.children}</>
        </div>

        {children}

        <div className="experience__main">{entriesJSX || renderEntries()}</div>
      </div>

      {editingExperienceState.value === StateValue.editing && (
        <EditExperience experience={experience} parentDispatch={dispatch} />
      )}
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
      id="experience-options-menu"
      direction="left"
    >
      <Dropdown.Menu>
        {newEntry && (
          <Dropdown.Header
            style={{
              display: "block",
            }}
            id={`${experienceIdPrefix}-new-entry-button`}
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
              id={`${experienceIdPrefix}-edit-menu`}
              onClick={() =>
                dispatch({
                  type: ActionType.EDIT_EXPERIENCE,
                })
              }
            />
          )}

          <Dropdown.Item
            text="Delete"
            value="Delete"
            label={{ color: "red", empty: true, circular: true }}
            id={`${experienceIdPrefix}-delete-button`}
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

// istanbul ignore next:
export default (props: CallerProps) => {
  const { hasConnection } = useContext(LayoutContext);

  return <ExperienceComponent {...props} hasConnection={hasConnection} />;
};
