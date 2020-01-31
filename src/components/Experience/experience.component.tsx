import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useContext,
} from "react";
import { Link } from "../Link";
import "./experience.styles.scss";
import {
  Props,
  IMenuOptions,
  reducer,
  ActionType,
  CallerProps,
  initState,
  StateValue,
  effectFunctions,
  OFFLINE_EXPERIENCE_SYNCED_NAVIGATION_STATE_KEY,
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
import {
  useCreateExperiencesMutation,
  useUpdateExperiencesOnlineMutation,
} from "../../graphql/update-experience.mutation";
import {
  successNotificationId,
  closeSubmitNotificationBtnSelector,
  errorsNotificationId,
  syncButtonId,
  newEntryTriggerId,
} from "./experience.dom";
import { Loading } from "../Loading/loading";
import { useCreateEntriesMutation } from "../../graphql/create-entries.mutation";
import { EbnisAppContext } from "../../context";

enum ClickContext {
  submit = "@experience-component/submit",
  resetForm = "@experience-component/reset-form",
  closeSubmitNotification = "@experience-component/close-submit-notification",
  openNewEntry = "@experience-component/openNewEntry",
  openExperienceEdit = "@experience-component/openExperienceEdit",
  sync = "@experience-component/sync",
}

export function ExperienceComponent(props: Props) {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cache,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    persistor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    client,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createExperiences,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createEntries,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateExperiencesOnline,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    offlineExperienceNewlySynced: offlineExperienceNewlySyncedProp,
    navigate,
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

  const [stateMachine, dispatch] = useReducer(reducer, props, initState);
  const {
    states: {
      editingExperience: editingExperienceState,
      submission: submissionState,
    },
    effects: { general: generalEffects },
    context: { offlineExperienceNewlySynced },
  } = stateMachine;

  const { id, hasUnsaved, title } = experience;
  const isOffline = isOfflineId(id);
  const isPartOffline = !isOffline && hasUnsaved;
  const isOnline = !isOffline && !hasUnsaved;

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

  // istanbul ignore next: can figure out how to test
  useEffect(() => {
    if (offlineExperienceNewlySyncedProp) {
      dispatch({
        type: ActionType.SET_OFFLINE_EXPERIENCE_NEWLY_SYNCED,
        data: offlineExperienceNewlySyncedProp,
      });
    }
  }, [offlineExperienceNewlySyncedProp]);

  useEffect(() => {
    if (generalEffects.value !== StateValue.hasEffects) {
      return;
    }

    for (const { key, ownArgs } of generalEffects.hasEffects.context.effects) {
      effectFunctions[key](
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        ownArgs as any,
        props,
        { dispatch, isOffline },
      );
    }

    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [generalEffects]);

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

  const onClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const { dataset } = target;

    switch (dataset.clickContext) {
      case ClickContext.closeSubmitNotification:
        dispatch({
          type: ActionType.CLOSE_SUBMIT_NOTIFICATION,
        });
        break;

      case ClickContext.openNewEntry:
        navigate(makeNewEntryRoute(id));
        break;

      case ClickContext.openExperienceEdit:
        dispatch({
          type: ActionType.EDIT_EXPERIENCE,
        });
        break;

      case ClickContext.sync:
        dispatch({
          type: ActionType.SYNC,
        });
        break;
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  return (
    <>
      {submissionState.value === StateValue.submitting && <Loading />}

      <div
        onClick={(onClick as unknown) as (e: React.MouseEvent) => void}
        className={makeClassNames({
          "bulma components-experience border-solid border-2 rounded": true,
          [className]: !!className,
          "border-blue-400": isOnline,
          "border-offline": isOffline,
          "border-part-offline": isPartOffline,
        })}
        id={id}
        {...otherProps}
      >
        <div className="m-2">
          {(offlineExperienceNewlySynced ||
            submissionState.value === StateValue.success) && (
            <div
              id={successNotificationId}
              className="notification is-success is-light"
            >
              <button
                data-click-context={ClickContext.closeSubmitNotification}
                className={`delete ${closeSubmitNotificationBtnSelector}`}
              />
              Changes saved successfully.
            </div>
          )}

          {submissionState.value === StateValue.errors && (
            <div
              className="notification is-danger is-light"
              id={errorsNotificationId}
            >
              <button
                data-click-context={ClickContext.closeSubmitNotification}
                className={`delete ${closeSubmitNotificationBtnSelector}`}
              />
              {submissionState.errors.context.errors}
            </div>
          )}
        </div>

        <div className="experience__header" {...headerProps}>
          <div className="mt-1 ml-1">
            <div className="columns is-mobile">
              <div className="font-bold column">{title} </div>

              {hasConnection && (hasUnsaved || isOffline) && (
                <div className="column">
                  <button
                    id={syncButtonId}
                    className="block w-full font-bold button is-rounded is-success"
                    data-click-context={ClickContext.sync}
                  >
                    Sync
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="options-menu-container">
              <OptionsMenuComponent experience={experience} {...menuOptions} />
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
}: Props["menuOptions"] & {
  experience: ExperienceFragment;
}) {
  const { id } = experience;
  const experienceIdPrefix = `experience-${id}`;

  return (
    <div
      className="options-menu__trigger dropdown is-hoverable"
      id="experience-options-menu"
    >
      <div className="dropdown-trigger">
        <button
          className="button is-info"
          aria-haspopup="true"
          aria-controls="dropdown-menu2"
        >
          <span className="icon is-small">
            <i className="fas fa-ellipsis-v" aria-hidden="true" />
          </span>

          <span className="options-menu__text">OPTIONS</span>
        </button>
      </div>

      <div className="dropdown-menu" id="dropdown-menu2" role="menu">
        <div className="dropdown-content">
          <a
            id={newEntryTriggerId}
            className="text-lg font-extrabold dropdown-item"
            data-click-context={ClickContext.openNewEntry}
          >
            <span className="mr-2 icon is-small">
              <i className="fas fa-external-link-alt" />
            </span>
            New Entry
          </a>

          <hr className="dropdown-divider" />

          <div
            className="font-bold dropdown-item js-edit-menu"
            id={`${experienceIdPrefix}-edit-menu`}
            data-click-context={ClickContext.openExperienceEdit}
          >
            Edit
          </div>
        </div>
      </div>
    </div>
  );
}

export function getTitle(arg?: { title: string }) {
  return arg ? arg.title : "Experience";
}

// istanbul ignore next:
export default (props: CallerProps) => {
  const { hasConnection, navigate, ...rest } = useContext(LayoutContext);
  const [updateExperiencesOnline] = useUpdateExperiencesOnlineMutation();
  const [createEntries] = useCreateEntriesMutation();
  const [createExperiences] = useCreateExperiencesMutation();
  const { client, persistor, cache } = useContext(EbnisAppContext);

  return (
    <ExperienceComponent
      {...props}
      hasConnection={hasConnection}
      updateExperiencesOnline={updateExperiencesOnline}
      navigate={navigate}
      createEntries={createEntries}
      createExperiences={createExperiences}
      client={client}
      persistor={persistor}
      cache={cache}
      offlineExperienceNewlySynced={
        rest.state && rest.state[OFFLINE_EXPERIENCE_SYNCED_NAVIGATION_STATE_KEY]
      }
    />
  );
};
