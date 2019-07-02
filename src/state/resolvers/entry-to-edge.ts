import {
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges,
} from "../../graphql/apollo-types/ExperienceFragment";

export function entryToEdge(
  entry: ExperienceFragment_entries_edges_node,
): ExperienceFragment_entries_edges {
  return {
    node: entry,
    cursor: "",
    __typename: "EntryEdge" as "EntryEdge",
  };
}
