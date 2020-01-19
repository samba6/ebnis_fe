import React, {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  useState,
} from "react";
import "./my-experiences.styles.scss";
import {
  ComponentProps,
  ExperienceProps,
  SearchResults,
  SearchComponentProps,
  CallerProps,
  DescriptionMap,
  SearchState,
  prepareExperiencesForSearch,
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
} from "./my-experiences.dom";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import fuzzysort from "fuzzysort";

enum ClickContext {
  goToExperience = "go-to-experience",
  toggleDescription = "toggle-description",
  searchLink = "search-link",
}

export function MyExperiences(props: ComponentProps) {
  const { experiences, navigate, error, loading, experiencesPrepared } = props;
  const experiencesLen = experiences.length;

  const noExperiences = experiencesLen === 0;

  const [idToShowingDescriptionMap, toggleShowDescription] = useState(() => {
    return experiences.reduce((acc, experience) => {
      const { description, id } = experience;

      if (description) {
        acc[id] = false;
      }

      return acc;
    }, {} as DescriptionMap);
  });

  useEffect(() => {
    toggleShowDescription(
      experiences.reduce((acc, experience) => {
        const { description, id } = experience;

        if (description) {
          acc[id] = false;
        }

        return acc;
      }, {} as DescriptionMap),
    );
  }, [experiences]);

  useEffect(() => {
    setDocumentTitle(makeSiteTitle(MY_EXPERIENCES_TITLE));

    return setDocumentTitle;
  }, []);

  const onClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const { dataset } = target;

    switch (dataset.clickContext) {
      case ClickContext.goToExperience:
        navigate(
          makeExperienceRoute(
            (target.closest("." + experienceSelector) as HTMLElement).id,
          ),
        );
        return;

      case ClickContext.toggleDescription: {
        const experienceId = (target.closest(
          "." + experienceSelector,
        ) as HTMLElement).id;

        toggleShowDescription(prev => {
          return {
            ...prev,
            [experienceId]: !prev[experienceId],
          };
        });
        return;
      }

      case ClickContext.searchLink: {
        const experienceId = dataset.experienceId as string;
        navigate(makeExperienceRoute(experienceId));
        return;
      }
    }
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
            navigate={navigate}
            experiencesPrepared={experiencesPrepared}
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
    <div className="components-experiences">
      <SidebarHeader title="My Experiences" sidebar={true} />

      <div className="main" onClick={onClick}>
        {renderMain()}
      </div>
    </div>
  );
}

const ExperiencesComponent = (props: {
  experiences: ExperienceFragment[];
  navigate: NavigateFn;
  idToShowingDescriptionMap: DescriptionMap;
}) => {
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
};

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
            <div className="pt-3 pb-3 experience-description card-content">
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
                    content: true,
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
  const { experiencesLen, experiencesPrepared } = props;
  const [state, setState] = useState<SearchState>({
    searchText: "",
    value: "inactive",
  });

  const searchFn = useCallback(
    (e: React.ChangeEvent) => {
      const searchText = (e.currentTarget as HTMLInputElement).value as string;

      setState(prev => {
        return { ...prev, searchText, value: "searching" };
      });

      setTimeout(() => {
        const results = fuzzysort
          .go(searchText, experiencesPrepared, {
            key: "title",
          })
          .map(searchResult => {
            const { obj } = searchResult;

            return {
              title: obj.title,
              id: obj.id,
            };
          });

        const searchState: SearchResults = {
          value: "results",
          results: {
            context: {
              results,
            },
          },
        };

        setState(prev => {
          return { ...prev, ...searchState };
        });
      });
    },
    [experiencesPrepared],
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
    <div className="relative z-10 pt-4 mb-5 ml-2 bulma my-search">
      <div className="control has-icons-right">
        <input
          className="input is-rounded"
          type="text"
          value={state.searchText}
          placeholder={`${experiencesLen} items`}
          onChange={searchFn}
          id={searchTextInputId}
        />

        <span className="icon is-right">
          <i className="fas fa-search" />
        </span>
      </div>

      {state.value === "results" && (
        <div
          className="absolute w-full mt-2 overflow-auto bg-white border border-solid menu"
          style={{ maxHeight: "250px" }}
        >
          <ul className="menu-list">
            {state.results.context.results.map(props => {
              const { id, title } = props;
              return (
                <li
                  className="border-b border-solid"
                  id={`search-result-${id}`}
                  key={id}
                  data-click-context={ClickContext.searchLink}
                  data-experience-id={id}
                >
                  <a className="search-experience-link">{title}</a>
                </li>
              );
            })}
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
