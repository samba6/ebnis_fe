import {
  UnsavedExperiencesProps,
  SavedExperiencesWithUnsavedEntriesProps
} from "../../state/unsaved-resolvers";
import {
  UploadUnsavedExperiencesMutationProps,
  UploadAllUnsavedsMutationProps
} from "../../graphql/upload-unsaveds.mutation";
import { CreateEntriesMutationGqlProps } from "../../graphql/create-entries.mutation";
import immer from "immer";
import { Reducer } from "react";
import { RouteComponentProps } from "@reach/router";
import {
  ExperienceFragment_fieldDefs,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment
} from "../../graphql/apollo-types/ExperienceFragment";
import { UploadAllUnsavedsMutation } from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { WithApolloClient } from "react-apollo";
import { ApolloError } from "apollo-client";

interface OwnProps
  extends UnsavedExperiencesProps,
    SavedExperiencesWithUnsavedEntriesProps,
    RouteComponentProps,
    WithApolloClient<{}> {}

export interface Props
  extends OwnProps,
    UploadUnsavedExperiencesMutationProps,
    CreateEntriesMutationGqlProps,
    UploadAllUnsavedsMutationProps {}

interface State {
  readonly tabs: { [k: number]: boolean };
  readonly uploading?: boolean;
  readonly uploadResult?: UploadAllUnsavedsMutation;
  readonly serverError?: string;
}

export enum ActionType {
  toggleTab = "@components/upload-unsaved/toggle-tab",
  setUploading = "@components/upload-unsaved/set-uploading",
  uploadResult = "@components/upload-unsaved/result",
  setServerError = "@components/upload-unsaved/set-server-error"
}

interface Action {
  type: ActionType;
  payload?:
    | number
    | boolean
    | UploadAllUnsavedsMutation
    | undefined
    | void
    | ApolloError;
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

      case ActionType.uploadResult:
        proxy.uploadResult = payload as UploadAllUnsavedsMutation;
        proxy.uploading = false;
        break;

      case ActionType.setServerError:
        proxy.serverError = (payload as ApolloError).message;
        proxy.uploading = false;
        break;
    }
  });
};

export function fieldDefToUnsavedData(
  value: ExperienceFragment_fieldDefs | null
) {
  const { clientId, name, type } = value as ExperienceFragment_fieldDefs;

  return { clientId, name, type };
}

export interface ExperiencesIdsToUnsavedEntriesMap {
  [k: string]: {
    unsavedEntries: ExperienceFragment_entries_edges_node[];
    experience: ExperienceFragment;
  };
}
