import { ExperienceFragment } from "./apollo-types/ExperienceFragment";
import { DataDefinitionFragment } from "./apollo-types/DataDefinitionFragment";
import { EntryFragment } from "./apollo-types/EntryFragment";
import { DataObjectFragment } from "./apollo-types/DataObjectFragment";

export const EXPERIENCE_TYPE_NAME: ExperienceFragment["__typename"] =
  "Experience";

export const DATA_DEFINITION_TYPE_NAME: DataDefinitionFragment["__typename"] =
  "DataDefinition";

export const ENTRY_TYPE_NAME: EntryFragment["__typename"] = "Entry";

export const DATA_OBJECT_TYPE_NAME: DataObjectFragment["__typename"] =
  "DataObject";
