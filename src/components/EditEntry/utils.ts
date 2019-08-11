import { EntryConnectionFragment } from "../../graphql/apollo-types/EntryConnectionFragment";
import { DataDefinitionFragment } from "../../graphql/apollo-types/DataDefinitionFragment";

export interface Props {
  entry: EntryFragment;
  definitions: DataDefinitionFragment[];
}

export type DefinitionFormValue = Pick<
  DataDefinitionFragment,
  Exclude<keyof DataDefinitionFragment, "__typename">
>;

export interface FormValues {
  definitions: DefinitionFormValue;
}
