import {
  UnsavedExperiencesProps,
  SavedExperiencesWithUnsavedEntriesProps,
  SavedExperiencesWithUnsavedEntriesData,
  UnsavedExperiencesData,
  entryNodesFromExperience,
} from "../../state/unsaved-resolvers";
import {
  UploadUnsavedExperiencesMutationProps,
  UploadAllUnsavedsMutationProps,
} from "../../graphql/upload-unsaveds.mutation";
import { CreateEntriesMutationGqlProps } from "../../graphql/create-entries.mutation";
import immer from "immer";
import { Reducer } from "react";
import { RouteComponentProps } from "@reach/router";
import {
  ExperienceFragment_fieldDefs,
  ExperienceFragment_entries_edges_node,
  ExperienceFragment,
} from "../../graphql/apollo-types/ExperienceFragment";
import { UploadAllUnsavedsMutation } from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { WithApolloClient } from "react-apollo";
import { ApolloError } from "apollo-client";
import { Dispatch } from "react";
import { isUnsavedId } from "../../constants";
import { UploadUnsavedExperiencesExperienceErrorFragment } from "../../graphql/apollo-types/UploadUnsavedExperiencesExperienceErrorFragment";
import { CreateEntriesErrorFragment } from "../../graphql/apollo-types/CreateEntriesErrorFragment";

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
  readonly serverError?: string | null;
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
  props: Pick<State, "unsavedExperiences" | "savedExperiences">,
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

        [] as ExperienceFragment_entries_edges_node[],
      );

      acc[experience.id] = {
        unsavedEntries,
        experience,
      };

      return acc;
    },
    {} as ExperiencesIdsToObjectMap,
  );

  const unsavedExperiencesIdsToObjectMap = unsavedExperiences.reduce(
    (acc, value) => {
      const experience = (value as unknown) as ExperienceFragment;

      acc[experience.id] = {
        unsavedEntries: entryNodesFromExperience(experience),

        experience,
      };

      return acc;
    },
    {} as ExperiencesIdsToObjectMap,
  );

  return {
    savedExperiences,
    unsavedExperiences,
    savedExperiencesLen,
    unsavedExperiencesLen,
    savedExperiencesIdsToObjectMap,
    unsavedExperiencesIdsToObjectMap,
    unSavedCount: savedExperiencesLen + unsavedExperiencesLen,
  };
}

export function stateInitializerFn(props: Props) {
  const {
    unSavedExperiencesProps: {
      unsavedExperiences: propsUnsavedExperiences = [],
    } = {} as UnsavedExperiencesData,

    savedExperiencesWithUnsavedEntriesProps: {
      savedExperiencesWithUnsavedEntries: savedExperiences = [],
    } = {} as SavedExperiencesWithUnsavedEntriesData,
  } = props;

  const unsavedExperiences = (propsUnsavedExperiences as unknown) as ExperienceFragment[];

  const cache = computeStatePropertiesFromProps({
    unsavedExperiences,
    savedExperiences,
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
      2: cache.savedExperiencesLen === 0 && cache.unsavedExperiencesLen !== 0,
    },
  };
}

export enum ActionType {
  toggleTab = "@components/upload-unsaved/toggle-tab",
  setUploading = "@components/upload-unsaved/set-uploading",
  uploadResult = "@components/upload-unsaved/result",
  setServerError = "@components/upload-unsaved/set-server-error",
  removeServerErrors = "@components/upload-unsaved/remove-server-error",
}

type Action =
  | [ActionType.toggleTab, number | string]
  | [ActionType.setUploading, boolean]
  | [ActionType.uploadResult, UploadAllUnsavedsMutation | undefined | void]
  | [ActionType.setServerError, ApolloError]
  | [ActionType.removeServerErrors];

export type DispatchType = Dispatch<Action>;

export const reducer: Reducer<State, Action> = (prevState, [type, payload]) => {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionType.toggleTab:
        {
          proxy.tabs = { [payload as number]: true };
        }
        break;

      case ActionType.setUploading:
        {
          proxy.uploading = payload as boolean;

          if (payload === true) {
            proxy.isUploadTriggered = true;
          }
        }
        break;

      case ActionType.uploadResult:
        {
          const uploadResult = payload as UploadAllUnsavedsMutation;
          proxy.uploadResult = uploadResult;
          proxy.uploading = false;

          const {
            savedExperiencesIdsToObjectMap,
            unsavedExperiencesIdsToObjectMap,
          } = proxy;

          let allUnsavedExperiencesSucceeded = true;
          let allUnsavedEntriesSucceeded = true;

          let hasUnsavedExperiencesUploadError = false;
          let hasSavedExperiencesUploadError = false;

          const { saveOfflineExperiences, createEntries } = uploadResult;

          if (saveOfflineExperiences) {
            saveOfflineExperiences.forEach(elm => {
              // istanbul ignore next: make typescript happy
              if (!elm) {
                hasUnsavedExperiencesUploadError = true;
                allUnsavedExperiencesSucceeded = false;
                return;
              }

              const { experience, entriesErrors, experienceError } = elm;

              let map = {} as ExperiencesIdsToObjectMap["k"];

              if (experienceError) {
                const { clientId } = experienceError;
                map = unsavedExperiencesIdsToObjectMap[clientId as string];

                try {
                  const [[k, v]] = Object.entries(
                    JSON.parse(experienceError.error),
                  );

                  map.experienceError = k + ": " + v;
                } catch (error) {
                  map.experienceError = experienceError.error;
                }
              } else if (experience) {
                const { clientId } = experience;
                map = unsavedExperiencesIdsToObjectMap[clientId as string];

                if (entriesErrors) {
                  map.entriesErrors = entriesErrorsToMap(
                    entriesErrors as CreateEntriesErrorFragment[],
                  );
                }
              }

              if (experienceError || entriesErrors) {
                map.didUploadSucceed = false;
                hasUnsavedExperiencesUploadError = true;
                allUnsavedExperiencesSucceeded = false;
              } else if (map.didUploadSucceed !== false) {
                map.didUploadSucceed = true;
              }
            });
          }

          if (createEntries) {
            createEntries.forEach(elm => {
              // istanbul ignore next: make typescript happy
              if (!elm) {
                hasSavedExperiencesUploadError = true;
                allUnsavedEntriesSucceeded = false;
                return;
              }

              const { errors, experienceId } = elm;
              const map = savedExperiencesIdsToObjectMap[experienceId];

              if (errors) {
                hasSavedExperiencesUploadError = true;
                allUnsavedEntriesSucceeded = false;
                map.didUploadSucceed = false;

                map.entriesErrors = entriesErrorsToMap(
                  errors as CreateEntriesErrorFragment[],
                );
              } else if (map.didUploadSucceed !== false) {
                map.didUploadSucceed = true;
              }
            });
          }

          proxy.allUnsavedExperiencesSucceeded = allUnsavedExperiencesSucceeded;
          proxy.hasUnsavedExperiencesUploadError = hasUnsavedExperiencesUploadError;

          proxy.allUnsavedEntriesSucceeded = allUnsavedEntriesSucceeded;
          proxy.hasSavedExperiencesUploadError = hasSavedExperiencesUploadError;

          proxy.allUploadSucceeded =
            allUnsavedExperiencesSucceeded && allUnsavedEntriesSucceeded;
        }
        break;

      case ActionType.setServerError:
        {
          proxy.uploading = false;
          proxy.hasUnsavedExperiencesUploadError = true;
          proxy.hasSavedExperiencesUploadError = true;

          const message = (payload as ApolloError).message;

          try {
            proxy.serverError = message;
          } catch (error) {
            proxy.serverError = message;
          }
        }
        break;

      case ActionType.removeServerErrors:
        proxy.serverError = null;
        break;
    }
  });
};

export function fieldDefToUnsavedData(
  value: ExperienceFragment_fieldDefs | null,
) {
  const { clientId, name, type } = value as ExperienceFragment_fieldDefs;

  return { clientId, name, type };
}

function entriesErrorsToMap(errors: CreateEntriesErrorFragment[]) {
  return errors.reduce((acc, { error, clientId }) => {
    acc[clientId] = error;
    return acc;
  }, {});
}

export interface ExperiencesIdsToObjectMap {
  [k: string]: ExperienceObjectMap;
}

export interface ExperienceObjectMap {
  unsavedEntries: ExperienceFragment_entries_edges_node[];
  experience: ExperienceFragment;
  didUploadSucceed?: boolean;
  experienceError?: UploadUnsavedExperiencesExperienceErrorFragment["error"];
  entriesErrors?: { [k: string]: string };
}
