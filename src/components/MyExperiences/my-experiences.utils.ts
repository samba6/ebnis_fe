import { RouteComponentProps, NavigateFn } from "@reach/router";
import { ExperienceConnectionFragment_edges_node } from "../../graphql/apollo-types/ExperienceConnectionFragment";
import { ApolloError } from "apollo-client";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import fuzzysort from "fuzzysort";

export function prepareExperiencesForSearch(experiences: ExperienceFragment[]) {
  return experiences.map(({ id, title }) => {
    return {
      id,
      title,
      target: fuzzysort.prepare(title) as Fuzzysort.Prepared,
    };
  });
}

////////////////////////// TYPES SECTION ////////////////////////////

export type SearchState = {
  searchText: string;
} & (
  | {
      value: "inactive";
    }
  | {
      value: "searching";
    }
  | SearchResults
);

export interface SearchResults {
  value: "results";

  results: {
    context: {
      results: MySearchResult[];
    };
  };
}

interface MySearchResult {
  title: string;
  id: string;
}

export type ExperiencesSearchPrepared = {
  target: Fuzzysort.Prepared;
  title: string;
  id: string;
}[];

export interface ComponentProps {
  navigate: NavigateFn;
  experiences: ExperienceConnectionFragment_edges_node[];
  loading: boolean;
  error?: ApolloError;
  experiencesPrepared: ExperiencesSearchPrepared;
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
  navigate: NavigateFn;
}

export type SearchComponentProps = {
  experiencesPrepared: ExperiencesSearchPrepared;
  navigate: NavigateFn;
  experiencesLen: number;
};
