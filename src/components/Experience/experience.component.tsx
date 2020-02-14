import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useContext,
  useLayoutEffect,
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
  DispatchType,
  SubmissionOnOnlineExperienceSynced,
} from "./experience.utils";
import { makeNewEntryRoute } from "../../constants/new-entry-route";
import { Entry } from "../Entry/entry.component";
import {
  ExperienceFragment_entries,
  ExperienceFragment_entries_edges,
  ExperienceFragment_entries_edges_node,
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
  experienceMenuTriggerDomId,
  onOnlineExperienceSyncedNotificationErrorDom,
  onOnlineExperienceSyncedNotificationSuccessDom,
} from "./experience.dom";
import { Loading } from "../Loading/loading";
import { useCreateEntriesMutation } from "../../graphql/create-entries.mutation";
import { EbnisAppContext } from "../../context";
import { execOnSyncOfflineExperienceComponentSuccess } from "../../apollo-cache/on-sync-offline-experience-component-success";
import { EbnisContextProps } from "../../context";
import { capitalize } from "../../general-utils";

export function ExperienceComponent(props: Props) {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createExperiences,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createEntries,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateExperiencesOnline,
    pathname,
    cache,
    persistor,
    client,
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
      editExperience: editExperienceState,
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

  // istanbul ignore next:
  useLayoutEffect(() => {
    execOnSyncOfflineExperienceComponentSuccess(
      pathname,
      () => {
        dispatch({
          type: ActionType.SET_OFFLINE_EXPERIENCE_NEWLY_SYNCED,
          value: true,
        });
      },
      { client, cache, persistor } as EbnisContextProps,
    );

    const cb = () => {
      const menuTrigger = document.getElementById(
        experienceMenuTriggerDomId,
      ) as HTMLElement;

      menuTrigger.classList.remove("is-active");
    };

    document.documentElement.addEventListener("click", cb);

    return () => {
      document.documentElement.removeEventListener("click", cb);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

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

  const closeSubmitNotificationHandler = useCallback(() => {
    dispatch({
      type: ActionType.CLOSE_SUBMIT_NOTIFICATION,
    });
  }, []);

  return (
    <>
      {submissionState.value === StateValue.submitting && <Loading />}

      <div
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
          {submissionState.value === StateValue.onOnlineExperienceSynced && (
            <div
              className={`
                relative
            `}
            >
              <OnOnlineExperienceSyncedNotifications
                state={submissionState}
                onClose={(index: number) => () => {
                  dispatch({
                    type:
                      ActionType.CLOSE_ON_ONLINE_EXPERIENCE_SYNCED_NOTIFICATION,
                    index,
                  });
                }}
              />
            </div>
          )}
          {offlineExperienceNewlySynced && (
            /*istanbul ignore next:*/
            <div
              id={successNotificationId}
              className="notification is-success is-light"
            >
              <button
                onClick={closeSubmitNotificationHandler}
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
                onClick={closeSubmitNotificationHandler}
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
                    onClick={() => {
                      dispatch({
                        type: ActionType.SYNC,
                      });
                    }}
                  >
                    Sync
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="options-menu-container">
              <OptionsMenuComponent
                dispatch={dispatch}
                navigate={navigate}
                experience={experience}
                {...menuOptions}
              />
            </div>
          </div>

          <>{headerProps.children}</>
        </div>

        {children}

        <div className="experience__main">{entriesJSX || renderEntries()}</div>
      </div>

      {editExperienceState.value === StateValue.editing && (
        <EditExperience experience={experience} parentDispatch={dispatch} />
      )}
    </>
  );
}

function OptionsMenuComponent({
  experience,
  navigate,
  dispatch,
}: { dispatch: DispatchType } & Props["menuOptions"] &
  Pick<Props, "experience" | "navigate">) {
  const { id } = experience;
  const experienceIdPrefix = `experience-${id}`;

  return (
    <div
      className="options-menu__trigger dropdown is-hoverable"
      id={experienceMenuTriggerDomId}
      onClick={e => {
        e.currentTarget.classList.toggle("is-active");
      }}
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
            onClick={() => {
              navigate(makeNewEntryRoute(id));
            }}
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
            onClick={() => {
              dispatch({
                type: ActionType.EDIT_EXPERIENCE,
              });
            }}
          >
            Edit
          </div>
        </div>
      </div>
    </div>
  );
}

function OnOnlineExperienceSyncedNotifications({
  state,
  onClose,
}: {
  state: SubmissionOnOnlineExperienceSynced;
  onClose: (index: number) => () => void;
}) {
  const {
    onOnlineExperienceSynced: {
      context: { data },
      states: { notifications },
    },
  } = state;

  return (
    <>
      {data.map(([header, value], index) => {
        return (
          <Fragment key={index}>
            {notifications[index] && (
              <div
                className={makeClassNames({
                  "notification is-light mb-2": true,
                  [`is-success ${onOnlineExperienceSyncedNotificationSuccessDom}`]:
                    value === "success",
                  [`is-danger ${onOnlineExperienceSyncedNotificationErrorDom}`]:
                    value !== "success",
                })}
              >
                <button onClick={onClose(index)} className={`delete`} />

                {value === "success" ? (
                  <>
                    <span className={`font-black mr-1`}>{header}</span>
                    <span>updated successfully</span>
                  </>
                ) : (
                  <div className={`flex`}>
                    <div>{header}</div>

                    <div className={`pl-1 flex-1`}>
                      {value.map(([l, s], i) => {
                        return (
                          <div key={i}>
                            <span className={`font-black mr-1`}>
                              {capitalize(l)}
                            </span>
                            <span>{s}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Fragment>
        );
      })}
    </>
  );
}

export function getTitle(arg?: { title: string }) {
  return arg ? arg.title : "Experience";
}

// istanbul ignore next:
export default (props: CallerProps) => {
  const { hasConnection, navigate, pathname } = useContext(LayoutContext);
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
      pathname={pathname}
    />
  );
};
