import { RouteComponentProps, NavigateFn } from "@reach/router";
import { ExperienceConnectionFragment_edges_node } from "../../graphql/apollo-types/ExperienceConnectionFragment";
import { Reducer, Dispatch, createContext } from "react";
import { wrapReducer } from "../../logger";
import immer from "immer";
import fuzzysort from "fuzzysort";
import { ApolloError } from "apollo-client";
import {
  LayoutDispatchType,
  PrefetchValues,
} from "../Layout/layout.utils";

export enum ActionTypes {
  TOGGLE_DESCRIPTION = "@my-experiences/toggle-description",
  SEARCH_TEXT_SET = "@my-experiences/search-started",
  EXEC_SEARCH = "@my-experiences/search-text-set",
  PREPARE_EXPERIENCES_FOR_SEARCH = "@my-experiences/prepare-experiences-for-search",
}

export function initState({
  experiences,
}: PrepareExperiencesPayload): StateMachine {
  return {
    context: {
      descriptionMap: {},
      experiencesPrepared: preExperiencesForSearch(experiences),
    },

    states: {
      search: {
        value: "inactive",

        context: {
          searchText: "",
        },
      },
    },
  };
}

export const reducer: Reducer<StateMachine, Action> = (state, action) =>
  wrapReducer(state, action, (prevState, { type, ...payload }) => {
    return immer(prevState, proxy => {
      switch (type) {
        case ActionTypes.TOGGLE_DESCRIPTION:
          {
            const { context } = proxy;
            const { id } = payload as { id: string };
            context.descriptionMap[id] = !context.descriptionMap[id];
          }

          break;

        case ActionTypes.SEARCH_TEXT_SET:
          {
            const { searchText } = payload as { searchText: string };
            proxy.states.search.value = "searching";
            proxy.states.search.context.searchText = searchText;
          }
          break;

        case ActionTypes.EXEC_SEARCH:
          {
            const { searchText } = payload as { searchText: string };

            const searching = proxy.states.search as SearchResults;

            const searchResultsState =
              searching.results || ({} as SearchResults["results"]);

            const context =
              searchResultsState.context ||
              ({} as SearchResults["results"]["context"]);

            searchResultsState.context = context;
            searching.results = searchResultsState;

            const genericSearch = searching as StateMachine["states"]["search"];
            genericSearch.value = "inactive";

            const searchResults = fuzzysort.go(
              searchText,
              proxy.context.experiencesPrepared,
              {
                key: "title",
              },
            );

            context.results = searchResults.map(searchResult => {
              const { obj } = searchResult;

              return {
                title: obj.title,
                price: obj.id,
              };
            });
          }

          break;

        case ActionTypes.PREPARE_EXPERIENCES_FOR_SEARCH:
          {
            proxy.context.experiencesPrepared = preExperiencesForSearch(
              (payload as PrepareExperiencesPayload).experiences,
            );
          }
          break;
      }
    });
  });

export function mapCompletelyOnlineExperiencesToIds(
  experiences: ExperienceConnectionFragment_edges_node[],
) {
  return experiences.reduce((acc, experience) => {
    const { hasUnsaved, id } = experience;

    if (!hasUnsaved) {
      acc.push(id);
    }

    return acc;
  }, [] as string[]);
}

function preExperiencesForSearch(
  experiences: ExperienceConnectionFragment_edges_node[],
) {
  return experiences.map(({ id, title }) => {
    return {
      id,
      title,
      target: fuzzysort.prepare(title) as Fuzzysort.Prepared,
    };
  });
}

export const dispatchContext = createContext<NoneStateContextValue>(
  {} as NoneStateContextValue,
);

export const DispatchProvider = dispatchContext.Provider;

////////////////////////// TYPES SECTION ////////////////////////////

export interface StateMachine {
  readonly context: {
    descriptionMap: DescriptionMap;
    experiencesPrepared: {
      target: Fuzzysort.Prepared;
      title: string;
      id: string;
    }[];
  };

  readonly states: {
    search: {
      context: SearchContext;
    } & (
      | {
          value: "inactive";
        }
      | {
          value: "searching";
        }
      | SearchResults
    );
  };
}

interface SearchContext {
  searchText: string;
}

export interface SearchResults {
  value: "results";

  results: {
    context: {
      results: MySearchResult[];
    };
  };
}

export interface MySearchResult {
  title: string;
  price: string; // this is actually the experience id but semantic UI search is dogmatic about the shape of object it accepts
}
export type Action =
  | {
      type: ActionTypes.TOGGLE_DESCRIPTION;
      id: string;
    }
  | {
      type: ActionTypes.EXEC_SEARCH;
      searchText: string;
    }
  | {
      type: ActionTypes.SEARCH_TEXT_SET;
      searchText: string;
    }
  | (PrepareExperiencesPayload & {
      type: ActionTypes.PREPARE_EXPERIENCES_FOR_SEARCH;
    });

export interface ComponentProps {
  navigate: NavigateFn;
  experiences: ExperienceConnectionFragment_edges_node[];
  loading: boolean;
  error?: ApolloError;
  layoutDispatch: LayoutDispatchType;
  fetchExperience: PrefetchValues;
}

export type CallerProps = RouteComponentProps<{}>;

export interface DescriptionMap {
  [k: string]: boolean;
}

export interface ExperienceProps {
  showingDescription: boolean;
  experience: ExperienceConnectionFragment_edges_node;
}

export interface NoneStateContextValue {
  dispatch: Dispatch<Action>;
  navigate: NavigateFn;
}

interface PrepareExperiencesPayload {
  experiences: ExperienceConnectionFragment_edges_node[];
}

export type SearchComponentProps = StateMachine["states"]["search"] &
  NoneStateContextValue;
