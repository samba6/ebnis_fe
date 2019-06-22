import {
  UnsavedExperiencesProps,
  SavedExperiencesUnsavedEntriesProps
} from "../../state/sync-unsaved-resolver";
import { UploadUnsavedExperiencesMutationProps } from "../../graphql/upload-offline-experiences.mutation";
import { CreateEntriesMutationGqlProps } from "../../graphql/create-entries.mutation";
import immer from "immer";
import { Reducer } from "react";
import { RouteComponentProps } from "@reach/router";

interface OwnProps
  extends UnsavedExperiencesProps,
    SavedExperiencesUnsavedEntriesProps,
    RouteComponentProps {}

export interface Props
  extends OwnProps,
    UploadUnsavedExperiencesMutationProps,
    CreateEntriesMutationGqlProps {}

interface State {
  readonly tabs: { [k: number]: boolean };
  readonly uploading?: boolean;
}

export enum ActionType {
  toggleTab = "@components/sync/toggle-tab",
  setUploading = "@components/sync/set-uploading"
}

interface Action {
  type: ActionType;
  payload?: number | boolean;
}

export const reducer: Reducer<State, Action> = (
  prevState,
  { type, payload }
) => {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionType.toggleTab:
        proxy.tabs = { [payload as number]: true };
        break;

      case ActionType.setUploading:
        proxy.uploading = payload as boolean;
        break;
    }
  });
};
