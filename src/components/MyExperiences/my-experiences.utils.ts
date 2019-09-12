import { RouteComponentProps } from "@reach/router";
import { WithApolloClient } from "react-apollo";
import { GetExperienceConnectionMiniProps } from "../../graphql/get-experience-connection-mini.query";
import {
  ExperienceConnectionFragment_edges_node,
  ExperienceConnectionFragment,
  ExperienceConnectionFragment_edges,
} from "../../graphql/apollo-types/ExperienceConnectionFragment";
import { Reducer, Dispatch, createContext } from "react";
import { wrapReducer } from "../../logger";
import immer from "immer";
import fuzzysort from "fuzzysort";

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
      searching: {
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
            proxy.states.searching.value = "active";
          }
          break;

        case ActionTypes.SEARCH_TEXT_SET:
          {
            const { searchText } = payload as { searchText: string };

            let searching = proxy.states.searching as SearchActive;

            const activeSearch =
              searching.active || ({} as SearchActive["active"]);

            const context =
              activeSearch.context || ({} as SearchActive["active"]["context"]);

            context.searchText = searchText;
            activeSearch.context = context;
            searching.active = activeSearch;

            const genericSearch = searching as StateMachine["states"]["searching"];
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

export const dispatchContext = createContext<MyExperiencesDispatchContextValue>(
  {} as MyExperiencesDispatchContextValue,
);

export const DispatchProvider = dispatchContext.Provider;

////////////////////////// TYPES ////////////////////////////

export interface StateMachine {
  readonly context: {
    descriptionMap: DescriptionMap;
  };

  readonly states: {
    searching: {
      context: SearchContext;
    } & (
      | {
          value: "inactive";
        }
      | SearchActive);
  };
}

interface SearchContext {
  experiencesPrepared: ({
    target: Fuzzysort.Prepared;
    title: string;
    id: string;
  })[];
}

export interface SearchActive {
  value: "active";

  active: {
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

type MyExperiencesDispatch = Dispatch<Action>;

export interface OwnProps
  extends RouteComponentProps<{}>,
    WithApolloClient<{}> {}

export interface Props extends OwnProps, GetExperienceConnectionMiniProps {}

export interface DescriptionMap {
  [k: string]: boolean;
}

export interface ExperienceProps {
  showingDescription: boolean;
  experience: ExperienceConnectionFragment_edges_node;
}

interface MyExperiencesDispatchContextValue {
  dispatch: MyExperiencesDispatch;
}
