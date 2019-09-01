import { RouteComponentProps } from "@reach/router";
import { WithApolloClient } from "react-apollo";
import { GetExperienceConnectionMiniProps } from "../../graphql/get-experience-connection-mini.query";
import { ExperienceConnectionFragment_edges_node, ExperienceConnectionFragment, ExperienceConnectionFragment_edges } from "../../graphql/apollo-types/ExperienceConnectionFragment";

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

export interface OwnProps
  extends RouteComponentProps<{}>,
    WithApolloClient<{}> {}

export interface Props extends OwnProps, GetExperienceConnectionMiniProps {}

export interface DescriptionMap {
  [k: string]: boolean;
}

export interface ToggleDescription {
  toggleDescription: (id: string) => void;
}

export interface ExperienceProps extends ToggleDescription {
  showingDescription: boolean;
  experience: ExperienceConnectionFragment_edges_node;
}
