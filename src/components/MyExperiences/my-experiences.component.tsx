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
  getExperiencesNodes,
  computeFetchPolicy,
  StateValue,
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
import { LayoutContext } from "../Layout/layout.utils";
import { writeShouldDeleteExperience } from "../../apollo-cache/should-delete-experience";

enum ClickContext {
  searchLink = "@my-experiences/search-link",
  searchInput = "@my-experiences/search-input",
  experienceMenuTrigger = "@my-experiences/experienceMenuTrigger",
}

export function MyExperiences(props: Props) {
  const { experiences, navigate, error, loading } = props;

  const [stateMachine, dispatch] = useReducer(reducer, experiences, initState);
  const {
    states: { search: searchState, experienceDeleted: experienceDeletedState },
    context: { idToShowingDescriptionMap },
  } = stateMachine;

  const experiencesLen = experiences.length;
  const noExperiences = experiencesLen === 0;

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
    dispatch({
      type: ActionType.ON_EXPERIENCES_CHANGED,
      experiences: experiences,
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

  return (
    <>
      <div className="components-experiences" id={domPrefix}>
        <SidebarHeader title="My Experiences" sidebar={true} />

        {experienceDeletedState.value === StateValue.active && (
          <div className="notification">
            <strong>{experienceDeletedState.active.context.title}</strong>

            <span className="text">successfully deleted.</span>

            <div
              className="close--container"
              id="close-notification"
              onClick={() => {
                dispatch({
                  type: ActionType.DISMISS_EXPERIENCE_DELETED_NOTIFICATION,
                });
              }}
            >
              <button className="close" />
            </div>
          </div>
        )}

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
                        writeShouldDeleteExperience(id);
                        navigate(makeExperienceRoute(id));
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
  const { data, loading, error } = useGetExperienceMiniQueryFn(
    computeFetchPolicy(hasConnection),
  );
  const getExperiences = data && data.getExperiences;

  const experiences = useMemo(() => {
    return getExperiencesNodes(getExperiences as ExperienceConnectionFragment);
  }, [getExperiences]);

  return (
    <MyExperiences
      experiences={experiences}
      error={error}
      loading={loading}
      navigate={navigate as NavigateFn}
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
