import {
  UnsavedExperiencesProps,
  SavedExperiencesWithUnsavedEntriesProps,
  SavedExperiencesWithUnsavedEntriesData,
  UnsavedExperiencesData,
  entryNodesFromExperience
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
import { Dispatch } from "react";
import { isUnsavedId } from "../../constants";

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

export interface DidUploadSucceed {
  readonly allUnsavedExperiencesSucceeded?: boolean;
  readonly allUnsavedEntriesSucceeded?: boolean;
  readonly hasUnsavedExperiencesUploadError?: boolean;
  readonly hasSavedExperiencesUploadError?: boolean;
  readonly allUploadSucceeded?: boolean;
}
export interface State extends DidUploadSucceed {
  readonly tabs: { [k: number]: boolean };
  readonly uploading?: boolean;
  readonly uploadResult?: UploadAllUnsavedsMutation;
  readonly serverError?: string;
  readonly isUploadTriggered?: boolean;
  readonly savedExperiences: ExperienceFragment[];
  readonly unsavedExperiences: ExperienceFragment[];
  readonly savedExperiencesLen: number;
  readonly unsavedExperiencesLen: number;
  readonly unSavedCount: number;
  readonly savedExperiencesIdsToObjectMap: ExperiencesIdsToObjectMap;
  readonly unsavedExperiencesIdsToObjectMap: ExperiencesIdsToObjectMap;
}

function computeStatePropertiesFromProps(
  props: Pick<State, "unsavedExperiences" | "savedExperiences">
) {
  const { unsavedExperiences, savedExperiences } = props;

  const savedExperiencesLen = savedExperiences.length;

  const unsavedExperiencesLen = unsavedExperiences.length;

  const savedExperiencesIdsToObjectMap = savedExperiences.reduce(
    (acc, experience) => {
      const unsavedEntries = entryNodesFromExperience(experience).reduce(
        (entriesAcc, entry) => {
          if (isUnsavedId(entry.id)) {
            entriesAcc.push(entry);
          }

          return entriesAcc;
        },

        [] as ExperienceFragment_entries_edges_node[]
      );

      acc[experience.id] = {
        unsavedEntries,
        experience
      };

      return acc;
    },
    {} as ExperiencesIdsToObjectMap
  );

  const unsavedExperiencesIdsToObjectMap = unsavedExperiences.reduce(
    (acc, value) => {
      const experience = (value as unknown) as ExperienceFragment;

      acc[experience.id] = {
        unsavedEntries: entryNodesFromExperience(experience),

        experience
      };

      return acc;
    },
    {} as ExperiencesIdsToObjectMap
  );

  return {
    savedExperiences,
    unsavedExperiences,
    savedExperiencesLen,
    unsavedExperiencesLen,
    savedExperiencesIdsToObjectMap,
    unsavedExperiencesIdsToObjectMap,
    unSavedCount: savedExperiencesLen + unsavedExperiencesLen
  };
}

export function stateInitializerFn(props: Props) {
  const {
    unSavedExperiencesProps: {
      unsavedExperiences: propsUnsavedExperiences = []
    } = {} as UnsavedExperiencesData,

    savedExperiencesWithUnsavedEntriesProps: {
      savedExperiencesWithUnsavedEntries: savedExperiences = []
    } = {} as SavedExperiencesWithUnsavedEntriesData
  } = props;

  const unsavedExperiences = (propsUnsavedExperiences as unknown) as ExperienceFragment[];

  const cache = computeStatePropertiesFromProps({
    unsavedExperiences,
    savedExperiences
  });

  // we will cache `unsavedExperiences` and `savedExperiencesWithUnsavedEntries`
  // because after upload mutation returns and apollo mutates the cache,
  // those objects will change and trigger re-render but we need to keep them
  // around so that we can show user how the upload fared - which succeeded/
  // failed

  return {
    ...cache,

    tabs: {
      1: cache.savedExperiencesLen !== 0,
      2: cache.savedExperiencesLen === 0 && cache.unsavedExperiencesLen !== 0
    }
  };
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

export type DispatchType = Dispatch<Action>;

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

        if (payload === true) {
          proxy.isUploadTriggered = true;
        }
        break;

      case ActionType.uploadResult:
        const uploadResult = payload as UploadAllUnsavedsMutation;
        const {
          savedExperiencesIdsToObjectMap,
          unsavedExperiencesIdsToObjectMap
        } = proxy;

        let allUnsavedExperiencesSucceeded = true;
        let allUnsavedEntriesSucceeded = true;

        let hasUnsavedExperiencesUploadError = false;
        let hasSavedExperiencesUploadError = false;

        const { saveOfflineExperiences, createEntries } = uploadResult;

        if (saveOfflineExperiences) {
          saveOfflineExperiences.forEach(elm => {
            if (!elm) {
              hasUnsavedExperiencesUploadError = true;
              allUnsavedExperiencesSucceeded = false;
              return;
            }

            const { experience, entriesErrors, experienceError } = elm;

            let map = {} as ExperiencesIdsToObjectMap["k"];
            let didUploadSucceed = map.didUploadSucceed;

            if (experienceError) {
              const { clientId } = experienceError;
              map = unsavedExperiencesIdsToObjectMap[clientId as string];
              map.hasUploadError = true;
              didUploadSucceed = map.didUploadSucceed;
            } else if (experience) {
              const { clientId } = experience;
              map = unsavedExperiencesIdsToObjectMap[clientId as string];
              didUploadSucceed = map.didUploadSucceed;

              if (entriesErrors) {
                map.hasUploadError = true;
              }
            }

            if (map.hasUploadError) {
              map.didUploadSucceed = false;
              hasUnsavedExperiencesUploadError = true;
              allUnsavedExperiencesSucceeded = false;
            } else if (
              typeof didUploadSucceed === "undefined" ||
              didUploadSucceed !== false
            ) {
              map.didUploadSucceed = true;
            }
          });
        }

        if (createEntries) {
          createEntries.forEach(elm => {
            if (!elm) {
              hasSavedExperiencesUploadError = true;
              allUnsavedEntriesSucceeded = false;
              return;
            }

            const { errors, expId } = elm;
            const map = savedExperiencesIdsToObjectMap[expId];

            const { didUploadSucceed } = map;

            if (errors) {
              hasSavedExperiencesUploadError = true;
              allUnsavedEntriesSucceeded = false;
              map.hasUploadError = true;
              map.didUploadSucceed = false;
            } else if (
              typeof didUploadSucceed === "undefined" ||
              didUploadSucceed !== false
            ) {
              map.didUploadSucceed = true;
            }
          });
        }

        proxy.uploadResult = uploadResult;
        proxy.uploading = false;

        proxy.allUnsavedExperiencesSucceeded = allUnsavedExperiencesSucceeded;
        proxy.hasUnsavedExperiencesUploadError = hasUnsavedExperiencesUploadError;

        proxy.allUnsavedEntriesSucceeded = allUnsavedEntriesSucceeded;
        proxy.hasSavedExperiencesUploadError = hasSavedExperiencesUploadError;

        proxy.allUploadSucceeded =
          allUnsavedExperiencesSucceeded && allUnsavedEntriesSucceeded;

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

export interface ExperiencesIdsToObjectMap {
  [k: string]: {
    unsavedEntries: ExperienceFragment_entries_edges_node[];
    experience: ExperienceFragment;
    hasUploadError?: boolean;
    didUploadSucceed?: boolean;
  };
}
