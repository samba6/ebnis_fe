import { EbnisComponentProps } from "../../types";
import { ExperienceFragment_fieldDefs } from "../../graphql/apollo-types/ExperienceFragment";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import { Dispatch } from "react";

export interface Props extends EbnisComponentProps {
  entry: EntryFragment;
  fieldDefs: ExperienceFragment_fieldDefs[];
  entriesLen: number;
  index: number;
  className?: string;
  editable?: boolean;
  dispatch?: Dispatch<EntryAction>;
}

export enum EntryActionTypes {
  editClicked = "@components/entry/edit-clicked",
}

export type EntryAction = [EntryActionTypes.editClicked, EntryFragment];
