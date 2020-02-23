import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useReducer,
  memo,
  useContext,
} from "react";
import "./my-experiences.styles.scss";
import {
  Props,
  ExperienceProps,
  SearchComponentProps,
  CallerProps,
  DescriptionMap,
  reducer,
  initState,
  ActionType,
  DispatchType,
  StateValue,
  DeleteExperienceActiveState,
  effectFunctions,
  getExperiencesNodes,
  computeFetchPolicy,
} from "./my-experiences.utils";
import { EXPERIENCE_DEFINITION_URL } from "../../routes";
import { makeExperienceRoute } from "../../constants/experience-route";
import { Loading } from "../Loading/loading";
import { setDocumentTitle, makeSiteTitle, isOfflineId } from "../../constants";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { Link } from "../Link";
import { ExperienceConnectionFragment } from "../../graphql/apollo-types/ExperienceConnectionFragment";
import { NavigateFn } from "@reach/router";
import lodashDebounce from "lodash/debounce";
import { useGetExperienceMiniQueryFn } from "../../graphql/get-experience-connection-mini.query";
import {
  searchDebounceTimeoutMs,
  cleanUpOnSearchExit,
} from "./my-experiences.injectables";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import makeClassNames from "classnames";
import {
  hideDescriptionIconSelector,
  toggleDescriptionMenuSelector,
  descriptionSelector,
  titleSelector,
  experienceSelector,
  searchTextInputId,
  domPrefix,
  noSearchMatchId,
  makeExperienceTitleDomId,
  experienceMenuSelector,
  deleteExperienceSelector,
} from "./my-experiences.dom";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { Modal } from "../Modal/modal-component";
import { useDeleteExperiencesMutation } from "../../graphql/delete-experiences.mutation";
import { EbnisAppContext } from "../../context";
import { LayoutContext } from "../Layout/layout.utils";

enum ClickContext {
  searchLink = "@my-experiences/search-link",
  searchInput = "@my-experiences/search-input",
  experienceMenuTrigger = "@my-experiences/experienceMenuTrigger",
  cancelDeleteExperience = "@my-experiences/cancel-delete-experience",
  okDeleteExperience = "@my-experiences/ok-delete-experience",
  concludeDeleteExperienceSuccess = "@my-experiences/experience-deleted-success",
}

export function MyExperiences(props: Props) {
  const { experiences, navigate, error, loading } = props;
  const experiencesLen = experiences.length;
  const noExperiences = experiencesLen === 0;

  const [stateMachine, dispatch] = useReducer(reducer, experiences, initState);
  const {
    states: { search: searchState, deleteExperience: deleteExperienceState },
    context: { idToShowingDescriptionMap },
    effects: { general: generalEffects },
  } = stateMachine;

  const onClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const { dataset } = target;

    switch (dataset.clickContext) {
      case ClickContext.searchLink: {
        e.stopImmediatePropagation();
        const experienceId = dataset.experienceId as string;
        navigate(makeExperienceRoute(experienceId));
        return;
      }

      case ClickContext.searchInput:
        e.stopImmediatePropagation();
        break;

      case ClickContext.experienceMenuTrigger:
        {
          e.stopImmediatePropagation();
          target.classList.toggle("is-active");

          document.querySelectorAll("." + experienceMenuSelector).forEach(e => {
            if (e !== target) {
              e.classList.remove("is-active");
            }
          });
        }
        break;

      case ClickContext.cancelDeleteExperience:
        e.stopImmediatePropagation();
        dispatch({
          type: ActionType.CONFIRM_DELETE_EXPERIENCE,
          confirmation: StateValue.cancelled,
        });
        break;

      case ClickContext.okDeleteExperience:
        e.stopImmediatePropagation();
        dispatch({
          type: ActionType.CONFIRM_DELETE_EXPERIENCE,
          confirmation: StateValue.ok,
        });
        break;

      case ClickContext.concludeDeleteExperienceSuccess:
        e.stopImmediatePropagation();
        dispatch({
          type: ActionType.CONCLUDE_DELETE_EXPERIENCE_SUCCESS,
        });
        break;

      default: {
        dispatch({
          type: ActionType.CLEAR_SEARCH,
        });

        document.querySelectorAll("." + experienceMenuSelector).forEach(e => {
          e.classList.remove("is-active");
        });
      }
    }
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
        { dispatch },
      );
    }

    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [generalEffects]);

  useEffect(() => {
    dispatch({
      type: ActionType.ON_EXPERIENCES_CHANGED,
      experiences,
    });
  }, [experiences]);

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(MY_EXPERIENCES_TITLE));

    const doc = document.documentElement;
    doc.addEventListener("click", onClick);

    return () => {
      setDocumentTitle;
      doc.removeEventListener("click", onClick);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  let deleteExperiencePromptState = false;
  let deletingExperienceState = false;
  let deleteExperienceSuccessState = false;
  let deleteExperienceContext = (null as unknown) as DeleteExperienceActiveState["active"]["context"];

  if (deleteExperienceState.value === StateValue.active) {
    const { active } = deleteExperienceState;
    const { states, context: c } = active;
    deleteExperienceContext = c;
    const { value } = states;
    deleteExperiencePromptState = value === StateValue.prompt;
    deletingExperienceState = value === StateValue.deletingExperience;

    deleteExperienceSuccessState =
      states.value === StateValue.deleted &&
      states.deleted.states.value === StateValue.success;
  }

  return (
    <>
      {deleteExperiencePromptState && (
        <Modal>
          <div>
            Ok to delete:
            <strong className="block">
              {deleteExperienceContext.experience.title}
            </strong>
          </div>

          <div className="flex justify-end">
            <button
              data-click-context={ClickContext.okDeleteExperience}
              className={`
                      mr-2
                      px-4
                      py-2
                      text-center
                      text-white
                      bg-red-400
                      active:bg-red-500
                      hover:bg-red-600
                      border
                      rounded-sm
                      cursor-pointer
                      focus:outline-none
                    `}
            >
              Ok
            </button>

            <button
              data-click-context={ClickContext.cancelDeleteExperience}
              className={`
                      ml-3
                      px-4
                      py-2
                      text-center
                      text-white
                      bg-blue-500
                      active:bg-blue-600
                      hover:bg-blue-700
                      border
                      border-transparent
                      rounded-sm
                      cursor-pointer
                      focus:outline-none
                    `}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {deletingExperienceState && <Loading />}

      {deleteExperienceSuccessState && (
        <Modal>
          <div>
            <strong className="block">
              {deleteExperienceContext.experience.title}
            </strong>
            successfully deleted
          </div>

          <div className="flex justify-end">
            <button
              data-click-context={ClickContext.concludeDeleteExperienceSuccess}
              className={`
                      mr-2
                      px-4
                      py-2
                      text-center
                      text-white
                      bg-red-400
                      active:bg-red-500
                      hover:bg-red-600
                      border
                      rounded-sm
                      cursor-pointer
                      focus:outline-none
                    `}
            >
              Ok
            </button>
          </div>
        </Modal>
      )}

      <div className="components-experiences" id={domPrefix}>
        <SidebarHeader title="My Experiences" sidebar={true} />

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
        <div className="main" onClick={onClick as any}>
          {loading ? (
            <Loading loading={loading} />
          ) : error ? (
            <div id="no-experiences-error">Error loading experiences</div>
          ) : noExperiences ? (
            <Link
              to={EXPERIENCE_DEFINITION_URL}
              className="no-experiences-info"
              id="no-experiences-info"
            >
              Click here to create your first experience
            </Link>
          ) : (
            <>
              <SearchComponent
                experiencesLen={experiencesLen}
                dispatch={dispatch}
                searchState={searchState}
              />

              <ExperiencesComponent
                idToShowingDescriptionMap={idToShowingDescriptionMap}
                navigate={navigate}
                experiences={experiences}
                dispatch={dispatch}
              />
            </>
          )}

          <Link
            className="new-experience-button"
            id="new-experience-button"
            to={EXPERIENCE_DEFINITION_URL}
          >
            +
          </Link>
        </div>
      </div>
    </>
  );
}

const ExperiencesComponent = memo(
  (props: ExperiencesComponentProps) => {
    const {
      dispatch,
      experiences,
      idToShowingDescriptionMap,
      navigate,
    } = props;

    return (
      <div id="experiences-container" className="experiences-container">
        {experiences.map(experience => {
          const { id } = experience;

          return (
            <ExperienceComponent
              key={id}
              showingDescription={idToShowingDescriptionMap[id]}
              experience={experience}
              navigate={navigate}
              dispatch={dispatch}
            />
          );
        })}
      </div>
    );
  },
  (currentProps, nextProps) => {
    return (
      currentProps.idToShowingDescriptionMap ===
        nextProps.idToShowingDescriptionMap &&
      currentProps.experiences === nextProps.experiences
    );
  },
);

const ExperienceComponent = React.memo(
  function ExperienceFn({
    experience,
    showingDescription,
    navigate,
    dispatch,
  }: ExperienceProps) {
    const { title, description, id, hasUnsaved } = experience;
    const isOffline = isOfflineId(id);
    const isPartOffline = !isOffline && hasUnsaved;

    return (
      <div
        className={makeClassNames({
          "bulma experience-container": true,
          "border-solid border-2 rounded": isOffline || isPartOffline,
          "border-offline": isOffline,
          "border-part-offline": isPartOffline,
          [experienceSelector]: true,
        })}
        id={id}
      >
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between w-full">
              <div
                id={makeExperienceTitleDomId(id)}
                className={makeClassNames({
                  "card-header-title flex-1 cursor-pointer": true,
                  [titleSelector]: true,
                })}
                onClick={() => {
                  navigate(makeExperienceRoute(id));
                }}
              >
                {title}
              </div>

              <div
                className={makeClassNames({
                  "items-center pl-8 pr-2 -mr-2 cursor-pointer dropdown is-right": true,
                  [experienceMenuSelector]: true,
                })}
                data-click-context={ClickContext.experienceMenuTrigger}
              >
                <div className="pointer-events-none">
                  <span className="mr-2 icon is-small">
                    <i className="fas fa-ellipsis-v" aria-hidden="true" />
                  </span>
                </div>

                <div className="mr-3 dropdown-menu" role="menu">
                  <div className="font-bold dropdown-content">
                    {description && (
                      <>
                        <a
                          className={makeClassNames({
                            "dropdown-item": true,
                            [toggleDescriptionMenuSelector]: true,
                          })}
                          onClick={() => {
                            dispatch({
                              type: ActionType.TOGGLE_DESCRIPTION,
                              id,
                            });
                          }}
                        >
                          Description
                        </a>

                        <hr className="dropdown-divider" />
                      </>
                    )}

                    <a
                      className={makeClassNames({
                        "dropdown-item js-edit-menu": true,
                        [deleteExperienceSelector]: true,
                      })}
                      onClick={() => {
                        dispatch({
                          type: ActionType.DELETE_EXPERIENCE,
                          experience,
                        });
                      }}
                    >
                      Delete
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {showingDescription && (
            <div
              className={makeClassNames({
                "experience-description card-content flex": true,
              })}
            >
              <div
                className="pt-1 pb-4 pl-5 pr-4"
                style={{
                  height: "50px",
                }}
                onClick={() => {
                  dispatch({
                    type: ActionType.TOGGLE_DESCRIPTION,
                    id,
                  });
                }}
              >
                <i
                  className={makeClassNames({
                    "pointer-events-none far fa-times-circle": true,
                    [hideDescriptionIconSelector]: true,
                  })}
                />
              </div>

              <div
                className={makeClassNames({
                  "content flex-1": true,
                  [descriptionSelector]: true,
                })}
              >
                {description}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },

  function ExperienceComponentPropsDiff(prevProps, currProps) {
    return prevProps.showingDescription === currProps.showingDescription;
  },
);

function SearchComponent(props: SearchComponentProps) {
  const { experiencesLen, searchState: state, dispatch } = props;

  const searchFn = useCallback(
    (e: React.ChangeEvent) => {
      const text = (e.currentTarget as HTMLInputElement).value as string;

      dispatch({
        type: ActionType.SET_SEARCH_TEXT,
        text,
      });

      setTimeout(() => {
        dispatch({
          type: ActionType.SEARCH,
          text,
        });
      });
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
    [],
  );

  const searchFnDebouncedRef = useRef(
    lodashDebounce(searchFn, searchDebounceTimeoutMs, {
      leading: true,
    }),
  );

  useEffect(() => {
    const debounced = searchFnDebouncedRef.current;

    return () => {
      cleanUpOnSearchExit(debounced);
    };
  }, []);

  return (
    <div className="relative pt-4 mb-5 ml-2 bulma my-search">
      <div className="control has-icons-right">
        <input
          className="input is-rounded"
          type="text"
          value={state.searchText}
          placeholder={`${experiencesLen} items`}
          onChange={searchFn}
          id={searchTextInputId}
          data-click-context={ClickContext.searchInput}
        />

        <span className="icon is-right">
          <i className="fas fa-search" />
        </span>
      </div>

      {state.value === "results" && (
        <div
          className="absolute w-full mt-2 overflow-auto bg-white border border-gray-500 border-solid menu"
          style={{ maxHeight: "250px" }}
        >
          <ul className="menu-list">
            {state.results.context.results.length === 0 ? (
              <li
                className="border-b border-solid no-search-match"
                id={noSearchMatchId}
              >
                No matches
              </li>
            ) : (
              state.results.context.results.map(props => {
                const { id, title } = props;
                return (
                  <li className="border-b border-solid" key={id}>
                    <a
                      className="search-experience-link"
                      id={`search-result-${id}`}
                      data-click-context={ClickContext.searchLink}
                      data-experience-id={id}
                    >
                      {title}
                    </a>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// istanbul ignore next:
export default (props: CallerProps) => {
  const { navigate } = props;
  const { hasConnection } = useContext(LayoutContext);
  const { cache, persistor } = useContext(EbnisAppContext);
  const [deleteExperiences] = useDeleteExperiencesMutation();
  const { data, loading, error } = useGetExperienceMiniQueryFn(
    computeFetchPolicy(hasConnection),
  );
  const getExperiences = data && data.getExperiences;

  const experiences = useMemo(() => {
    return getExperiencesNodes(getExperiences as ExperienceConnectionFragment);
  }, [getExperiences]);

  return (
    <MyExperiences
      deleteExperiences={deleteExperiences}
      experiences={experiences}
      error={error}
      loading={loading}
      navigate={navigate as NavigateFn}
      cache={cache}
      persistor={persistor}
      hasConnection={hasConnection}
    />
  );
};

interface ExperiencesComponentProps {
  experiences: ExperienceFragment[];
  navigate: NavigateFn;
  idToShowingDescriptionMap: DescriptionMap;
  dispatch: DispatchType;
}
