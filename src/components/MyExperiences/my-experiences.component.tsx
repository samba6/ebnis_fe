import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useReducer,
  memo,
} from "react";
import "./my-experiences.styles.scss";
import {
  ComponentProps,
  ExperienceProps,
  SearchComponentProps,
  CallerProps,
  DescriptionMap,
  prepareExperiencesForSearch,
  reducer,
  initState,
  ActionType,
} from "./my-experiences.utils";
import { EXPERIENCE_DEFINITION_URL } from "../../routes";
import { makeExperienceRoute } from "../../constants/experience-route";
import { Loading } from "../Loading/loading";
import { setDocumentTitle, makeSiteTitle, isOfflineId } from "../../constants";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { Link } from "../Link";
import {
  ExperienceConnectionFragment_edges,
  ExperienceConnectionFragment_edges_node,
} from "../../graphql/apollo-types/ExperienceConnectionFragment";
import { NavigateFn } from "@reach/router";
import lodashDebounce from "lodash/debounce";
import {
  GetExperienceConnectionMini,
  GetExperienceConnectionMiniVariables,
} from "../../graphql/apollo-types/GetExperienceConnectionMini";
import {
  GET_EXPERIENCES_MINI_QUERY,
  getExperienceConnectionMiniVariables,
} from "../../graphql/get-experience-connection-mini.query";
import { useQuery } from "@apollo/react-hooks";
import {
  searchDebounceTimeoutMs,
  cleanUpOnSearchExit,
} from "./my-experiences.injectables";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import makeClassNames from "classnames";
import {
  hideDescriptionIconSelector,
  showDescriptionIconSelector,
  descriptionSelector,
  titleSelector,
  experienceSelector,
  searchTextInputId,
  domPrefix,
  noSearchMatchId,
} from "./my-experiences.dom";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";

enum ClickContext {
  goToExperience = "go-to-experience",
  toggleDescription = "toggle-description",
  searchLink = "search-link",
  searchInput = "search-input",
}

export function MyExperiences(props: ComponentProps) {
  const { experiences, navigate, error, loading } = props;
  const experiencesLen = experiences.length;
  const noExperiences = experiencesLen === 0;

  const [stateMachine, dispatch] = useReducer(reducer, experiences, initState);
  const {
    states: { search: searchState },
    context: { idToShowingDescriptionMap },
  } = stateMachine;

  const onClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const { dataset } = target;

    switch (dataset.clickContext) {
      case ClickContext.goToExperience:
        e.stopImmediatePropagation();
        navigate(
          makeExperienceRoute(
            (target.closest("." + experienceSelector) as HTMLElement).id,
          ),
        );
        return;

      case ClickContext.toggleDescription: {
        e.stopImmediatePropagation();
        const id = (target.closest("." + experienceSelector) as HTMLElement).id;

        dispatch({
          type: ActionType.TOGGLE_DESCRIPTION,
          id,
        });

        return;
      }

      case ClickContext.searchLink: {
        e.stopImmediatePropagation();
        const experienceId = dataset.experienceId as string;
        navigate(makeExperienceRoute(experienceId));
        return;
      }

      case ClickContext.searchInput:
        e.stopImmediatePropagation();
        break;

      default: {
        dispatch({
          type: ActionType.CLEAR_SEARCH,
        });
      }
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

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

  function renderMain() {
    if (loading) {
      return <Loading loading={loading} />;
    }

    if (error) {
      return <div id="no-experiences-error">Error loading experiences</div>;
    }

    return (
      <>
        {!noExperiences && (
          <SearchComponent
            experiencesLen={experiencesLen}
            dispatch={dispatch}
            searchState={searchState}
          />
        )}

        {noExperiences && (
          <Link
            to={EXPERIENCE_DEFINITION_URL}
            className="no-experiences-info"
            id="no-experiences-info"
          >
            Click here to create your first experience
          </Link>
        )}

        {!noExperiences && (
          <ExperiencesComponent
            idToShowingDescriptionMap={idToShowingDescriptionMap}
            navigate={navigate}
            experiences={experiences}
          />
        )}

        <Link
          className="new-experience-button"
          id="new-experience-button"
          to={EXPERIENCE_DEFINITION_URL}
        >
          +
        </Link>
      </>
    );
  }

  return (
    <div className="components-experiences" id={domPrefix}>
      <SidebarHeader title="My Experiences" sidebar={true} />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
      <div className="main" onClick={onClick as any}>
        {renderMain()}
      </div>
    </div>
  );
}

const ExperiencesComponent = memo(
  (props: ExperiencesComponentProps) => {
    const { experiences, idToShowingDescriptionMap } = props;

    return (
      <div id="experiences-container" className="experiences-container">
        {experiences.map(experience => {
          const { id } = experience;

          return (
            <ExperienceComponent
              key={id}
              showingDescription={idToShowingDescriptionMap[id]}
              experience={experience}
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
  function ExperienceFn({ experience, showingDescription }: ExperienceProps) {
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
            <div
              data-click-context={ClickContext.goToExperience}
              className={makeClassNames({
                "card-header-title": true,
                [titleSelector]: true,
              })}
            >
              {title}
            </div>
          </div>

          {!!description && (
            <div
              className={makeClassNames({
                "experience-description card-content": true,
              })}
            >
              {showingDescription ? (
                <i
                  className={makeClassNames({
                    "fas fa-eye-slash": true,
                    [hideDescriptionIconSelector]: true,
                  })}
                  data-click-context={ClickContext.toggleDescription}
                />
              ) : (
                <i
                  className={makeClassNames({
                    "fas fa-eye": true,
                    [showDescriptionIconSelector]: true,
                  })}
                  data-click-context={ClickContext.toggleDescription}
                />
              )}

              {showingDescription && (
                <div
                  className={makeClassNames({
                    "content pt-2": true,
                    [descriptionSelector]: true,
                  })}
                >
                  {description}
                </div>
              )}
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

  const { data, loading, error } = useQuery<
    GetExperienceConnectionMini,
    GetExperienceConnectionMiniVariables
  >(GET_EXPERIENCES_MINI_QUERY, {
    variables: getExperienceConnectionMiniVariables,
  });

  const getExperiences = data && data.getExperiences;

  const experiences = useMemo(() => {
    if (!getExperiences) {
      return [];
    }

    return (getExperiences.edges as ExperienceConnectionFragment_edges[]).map(
      edge => edge.node as ExperienceConnectionFragment_edges_node,
    );
  }, [getExperiences]);
  return (
    <MyExperiences
      experiences={experiences}
      error={error}
      loading={loading}
      navigate={navigate as NavigateFn}
      experiencesPrepared={prepareExperiencesForSearch(experiences)}
    />
  );
};

interface ExperiencesComponentProps {
  experiences: ExperienceFragment[];
  navigate: NavigateFn;
  idToShowingDescriptionMap: DescriptionMap;
}
