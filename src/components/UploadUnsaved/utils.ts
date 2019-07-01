import {
  GetAllUnSavedQueryProps,
  GetUnsavedSummary,
  SavedAndUnsavedExperienceSummary,
} from "../../state/unsaved-resolvers";
import {
  UploadUnsavedExperiencesMutationProps,
  UploadAllUnsavedsMutationProps,
} from "../../graphql/upload-unsaveds.mutation";
import { CreateEntriesMutationGqlProps } from "../../graphql/create-entries.mutation";
import immer, { Draft } from "immer";
import { Reducer } from "react";
import { RouteComponentProps } from "@reach/router";
import { ExperienceFragment_fieldDefs } from "../../graphql/apollo-types/ExperienceFragment";
import {
  UploadAllUnsavedsMutation,
  UploadAllUnsavedsMutation_saveOfflineExperiences,
  UploadAllUnsavedsMutation_createEntries,
} from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { WithApolloClient } from "react-apollo";
import { ApolloError } from "apollo-client";
import { Dispatch } from "react";
import { UploadUnsavedExperiencesExperienceErrorFragment } from "../../graphql/apollo-types/UploadUnsavedExperiencesExperienceErrorFragment";
import { CreateEntriesErrorFragment } from "../../graphql/apollo-types/CreateEntriesErrorFragment";

interface OwnProps
  extends GetAllUnSavedQueryProps,
    RouteComponentProps,
    WithApolloClient<{}> {}

export interface Props
  extends OwnProps,
    UploadUnsavedExperiencesMutationProps,
    CreateEntriesMutationGqlProps,
    UploadAllUnsavedsMutationProps {}

export interface State {
  readonly allUnsavedExperiencesSucceeded?: boolean;
  readonly allUnsavedEntriesSucceeded?: boolean;
  readonly hasUnsavedExperiencesUploadError?: boolean;
  readonly hasSavedExperiencesUploadError?: boolean;
  readonly allUploadSucceeded?: boolean;
  readonly tabs: { [k: number]: boolean };
  readonly uploading?: boolean;
  readonly uploadResult?: UploadAllUnsavedsMutation;
  readonly serverError?: string | null;
  readonly isUploadTriggered?: boolean;
  readonly savedExperiencesLen: number;
  readonly unsavedExperiencesLen: number;
  readonly unSavedCount: number;
  readonly savedExperiencesMap: ExperiencesIdsToObjectMap;
  readonly unsavedExperiencesMap: ExperiencesIdsToObjectMap;
}

export function stateInitializerFn(getAllUnsaved?: GetUnsavedSummary) {
  if (!getAllUnsaved) {
    return {
      tabs: {},
      unsavedExperiencesMap: {},
      savedExperiencesMap: {},
    } as State;
  }

  const {
    savedExperiencesLen = 0,
    unsavedExperiencesLen = 0,
    unsavedExperiencesMap = {},
    savedExperiencesMap = {},
  } = getAllUnsaved;

  return {
    ...getAllUnsaved,

    tabs: {
      1: savedExperiencesLen !== 0,
      2: savedExperiencesLen === 0 && unsavedExperiencesLen !== 0,
    },
    unSavedCount: savedExperiencesLen + unsavedExperiencesLen,
    savedExperiencesMap,
    unsavedExperiencesMap,
    savedExperiencesLen,
    unsavedExperiencesLen,
  } as State;
}

export enum ActionType {
  toggleTab = "@components/upload-unsaved/toggle-tab",
  setUploading = "@components/upload-unsaved/set-uploading",
  uploadResult = "@components/upload-unsaved/result",
  setServerError = "@components/upload-unsaved/set-server-error",
  removeServerErrors = "@components/upload-unsaved/remove-server-error",
  initStateFromProps = "@components/upload-unsaved/init-state-from-props",
}

type Action =
  | [ActionType.toggleTab, number | string]
  | [ActionType.setUploading, boolean]
  | [ActionType.uploadResult, UploadAllUnsavedsMutation | undefined | void]
  | [ActionType.setServerError, ApolloError]
  | [ActionType.removeServerErrors]
  | [ActionType.initStateFromProps, GetUnsavedSummary];

export type DispatchType = Dispatch<Action>;

export const reducer: Reducer<State, Action> = (prevState, [type, payload]) => {
  return immer(prevState, proxy => {
    switch (type) {
      case ActionType.initStateFromProps:
        {
          Object.entries(
            stateInitializerFn(payload as GetUnsavedSummary),
          ).forEach(([k, v]) => {
            proxy[k] = v;
          });
        }

        break;

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

          const { saveOfflineExperiences, createEntries } = uploadResult;

          updateStateWithUnsavedExperiencesUploadResult(
            proxy,
            saveOfflineExperiences,
          );

          updateStateWithSavedExperiencesUploadResult(proxy, createEntries);

          proxy.allUploadSucceeded =
            proxy.allUnsavedExperiencesSucceeded &&
            proxy.allUnsavedEntriesSucceeded;
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

function updateStateWithSavedExperiencesUploadResult(
  stateProxy: Draft<State>,
  createEntries: (UploadAllUnsavedsMutation_createEntries | null)[] | null,
) {
  stateProxy.allUnsavedEntriesSucceeded = true;
  stateProxy.hasSavedExperiencesUploadError = false;

  if (!createEntries) {
    return;
  }

  const { savedExperiencesMap } = stateProxy;

  createEntries.forEach(elm => {
    // istanbul ignore next: make typescript happy
    if (!elm) {
      stateProxy.hasSavedExperiencesUploadError = true;
      stateProxy.allUnsavedEntriesSucceeded = false;
      return;
    }

    const { errors, experienceId } = elm;
    const map = savedExperiencesMap[experienceId];

    if (errors) {
      stateProxy.hasSavedExperiencesUploadError = true;
      stateProxy.allUnsavedEntriesSucceeded = false;
      map.didUploadSucceed = false;

      map.entriesErrors = entriesErrorsToMap(
        errors as CreateEntriesErrorFragment[],
      );
    } else if (map.didUploadSucceed !== false) {
      map.didUploadSucceed = true;
    }
  });
}

function updateStateWithUnsavedExperiencesUploadResult(
  stateProxy: Draft<State>,
  saveOfflineExperiences:
    | (UploadAllUnsavedsMutation_saveOfflineExperiences | null)[]
    | null,
) {
  stateProxy.allUnsavedExperiencesSucceeded = true;
  stateProxy.hasUnsavedExperiencesUploadError = false;

  if (!saveOfflineExperiences) {
    return;
  }

  const { unsavedExperiencesMap } = stateProxy;

  saveOfflineExperiences.forEach(elm => {
    // istanbul ignore next: make typescript happy
    if (!elm) {
      stateProxy.hasUnsavedExperiencesUploadError = true;
      stateProxy.allUnsavedExperiencesSucceeded = false;
      return;
    }

    const { experience, entriesErrors, experienceError } = elm;

    let map = {} as ExperiencesIdsToObjectMap["k"];

    if (experienceError) {
      const { clientId } = experienceError;
      map = unsavedExperiencesMap[clientId as string];

      try {
        const [[k, v]] = Object.entries(JSON.parse(experienceError.error));

        map.experienceError = k + ": " + v;
      } catch (error) {
        map.experienceError = experienceError.error;
      }
    } else if (experience) {
      const { clientId } = experience;
      map = unsavedExperiencesMap[clientId as string];

      if (entriesErrors) {
        map.entriesErrors = entriesErrorsToMap(
          entriesErrors as CreateEntriesErrorFragment[],
        );
      }
    }

    if (experienceError || entriesErrors) {
      map.didUploadSucceed = false;
      stateProxy.hasUnsavedExperiencesUploadError = true;
      stateProxy.allUnsavedExperiencesSucceeded = false;
    } else if (map.didUploadSucceed !== false) {
      map.didUploadSucceed = true;
    }
  });
}

export interface ExperiencesIdsToObjectMap {
  [k: string]: ExperienceObjectMap;
}

export interface ExperienceObjectMap extends SavedAndUnsavedExperienceSummary {
  didUploadSucceed?: boolean;
  experienceError?: UploadUnsavedExperiencesExperienceErrorFragment["error"];
  entriesErrors?: { [k: string]: string };
}
