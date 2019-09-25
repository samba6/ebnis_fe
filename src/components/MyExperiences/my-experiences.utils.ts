import { RouteComponentProps, NavigateFn } from "@reach/router";
import {
  ExperienceConnectionFragment_edges_node,
  ExperienceConnectionFragment,
  ExperienceConnectionFragment_edges,
} from "../../graphql/apollo-types/ExperienceConnectionFragment";
import { Reducer, Dispatch, createContext } from "react";
import { wrapReducer } from "../../logger";
import immer from "immer";
import fuzzysort from "fuzzysort";
import { Cancelable } from "lodash";

export enum ActionTypes {
  TOGGLE_DESCRIPTION = "@my-experiences/toggle-description",
  SEARCH_STARTED = "@my-experiences/search-started",
  SEARCH_TEXT_SET = "@my-experiences/search-text-set",
}

export function initState({
  experiences,
}: {
  experiences: ExperienceConnectionFragment_edges_node[];
}): StateMachine {
  return {
    context: {
      descriptionMap: {},
    },

    states: {
      search: {
        value: "inactive",

        context: {
          experiencesPrepared: experiences.map(({ id, title }) => {
            return {
              id,
              title,
              target: fuzzysort.prepare(title) as Fuzzysort.Prepared,
            };
          }),
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

        case ActionTypes.SEARCH_STARTED:
          {
            proxy.states.search.value = "searching";
          }
          break;

        case ActionTypes.SEARCH_TEXT_SET:
          {
            const { searchText } = payload as { searchText: string };

            let searching = proxy.states.search as SearchResults;

            const searchResultsState =
              searching.results || ({} as SearchResults["results"]);

            const context =
              searchResultsState.context ||
              ({} as SearchResults["results"]["context"]);

            context.searchText = searchText;
            searchResultsState.context = context;
            searching.results = searchResultsState;

            const genericSearch = searching as StateMachine["states"]["search"];
            genericSearch.value = "inactive";

            const searchResults = fuzzysort.go(
              searchText,
              genericSearch.context.experiencesPrepared,
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
      }
    });
  });

export function mapSavedExperiencesToIds(
  experienceConnection: ExperienceConnectionFragment,
) {
  return (experienceConnection.edges as ExperienceConnectionFragment_edges[]).reduce(
    (acc, edge: ExperienceConnectionFragment_edges) => {
      const {
        hasUnsaved,
        id,
      } = edge.node as ExperienceConnectionFragment_edges_node;

      if (!hasUnsaved) {
        acc.push(id);
      }

      return acc;
    },
    [] as string[],
  );
}

export const dispatchContext = createContext<NoneStateContextValue>(
  {} as NoneStateContextValue,
);

export const DispatchProvider = dispatchContext.Provider;

////////////////////////// TYPES ////////////////////////////

export interface StateMachine {
  readonly context: {
    descriptionMap: DescriptionMap;
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
      | SearchResults);
  };
}

interface SearchContext {
  experiencesPrepared: ({
    target: Fuzzysort.Prepared;
    title: string;
    id: string;
  })[];
}

export interface SearchResults {
  value: "results";

  results: {
    context: {
      searchText: string;

      results: MySearchResult[];
    };
  };
}

export interface MySearchResult {
  title: string;
  price: string; // this is actually the experience id but semantic UI search is dogmatic about the shape of object it accepts
}

type Action =
  | {
      type: ActionTypes.TOGGLE_DESCRIPTION;
      id: string;
    }
  | {
      type: ActionTypes.SEARCH_TEXT_SET;
      searchText: string;
    }
  | {
      type: ActionTypes.SEARCH_STARTED;
    };

export type Props = RouteComponentProps<{}>;

export interface DescriptionMap {
  [k: string]: boolean;
}

export interface ExperienceProps {
  showingDescription: boolean;
  experience: ExperienceConnectionFragment_edges_node;
}

interface NoneStateContextValue {
  dispatch: Dispatch<Action>;
  navigate: NavigateFn;
  searchDebounceTimeoutMs: number;
  cleanUpOnSearchExit: (arg: Cancelable) => void;
}
