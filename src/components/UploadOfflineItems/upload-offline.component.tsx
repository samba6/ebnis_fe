import React, {
  useReducer,
  useEffect,
  useContext,
  useLayoutEffect,
} from "react";
import {
  Props,
  reducer,
  ActionType,
  definitionToUnsavedData,
  ExperiencesIdsToObjectMap,
  DispatchType,
  StateMachine,
  stateInitializerFn,
  ExperienceObjectMap,
  CreationMode,
  onUploadResultsReceived,
  PartialUploadSuccessState,
  ExperiencesUploadedState,
  ExperiencesUploadedResultState,
  TabsState,
} from "./upload-offline.utils";
import { Loading } from "../Loading/loading";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { ExperienceFragment_entries_edges_node } from "../../graphql/apollo-types/ExperienceFragment";
import "./upload-offline.styles.scss";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import makeClassNames from "classnames";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { CreateEntriesInput } from "../../graphql/apollo-types/globalTypes";
import { UploadOfflineItemsMutationFn } from "../../graphql/upload-offline-items.mutation";
import { isConnected } from "../../state/connections";
import { NavigateFn } from "@reach/router";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import { UploadOfflineItemsMutationVariables } from "../../graphql/apollo-types/UploadOfflineItemsMutation";
import { Experience } from "../Experience/experience.component";
import { scrollIntoView } from "../scroll-into-view";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import { Entry } from "../Entry/entry.component";
import {
  LayoutActionType,
  LayoutUnchangingContext,
} from "../Layout/layout.utils";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../../state/resolvers/update-get-experiences-mini-query";
import { deleteIdsFromCache } from "../../state/resolvers/delete-references-from-cache";
import { deleteExperiencesIdsFromOfflineItemsInCache } from "../../state/resolvers/update-experiences-in-cache";
import { EXPERIENCES_URL } from "../../routes";
import { updateCache } from "./update-cache";
import { useDeleteCachedQueriesMutationsOnExit } from "../use-delete-mutations-on-exit";
import { makeSiteTitle, setDocumentTitle } from "../../constants";
import { UPLOAD_OFFLINE_ITEMS_TITLE } from "../../constants/upload-offline-title";
import { IconProps } from "semantic-ui-react";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { EbnisAppContext } from "../../context";
import {
  useGetAllUnsavedQuery,
  useUploadOfflineExperiencesMutation,
  useUploadOfflineItemsMutation,
  useUploadOnlineEntriesMutation,
  addUploadOfflineItemsResolvers,
} from "./upload-offline.injectables";
import {
  makeExperienceComponentId,
  createdOnlineExperiencesContainerId,
  createdOfflineExperiencesContainerId,
  makeExperienceUploadStatusClassNames,
  makeUploadStatusIconId,
  makeEntryId,
  makeExperienceErrorId,
  uploadBtnDomId,
  offlineExperiencesTabMenuDomId,
} from "./upload-offline.dom";
import { QUERY_NAME_getExperienceFull } from "../../graphql/get-experience-full.query";

const timeoutMs = 500;
const REDIRECT_ROUTE = makeSiteTitle(MY_EXPERIENCES_TITLE);

export function UploadOfflineItems(props: Props) {
  const { navigate } = props;
  const [uploadUnsavedExperiences] = useUploadOfflineExperiencesMutation();
  const [uploadAllUnsaveds] = useUploadOfflineItemsMutation();

  const [uploadSavedExperiencesEntries] = useUploadOnlineEntriesMutation();

  const { data, loading } = useGetAllUnsavedQuery();
  const getOfflineItems = data && data.getOfflineItems;

  const [stateMachine, dispatch] = useReducer(
    reducer,
    getOfflineItems,
    stateInitializerFn,
  );

  const {
    completelyOfflineCount,
    partlyOfflineCount,
    partialOnlineMap,
    completelyOfflineMap,
    shouldRedirect,
    states: { upload, dataLoaded, tabs: tabsState },
    context: { allCount },
  } = stateMachine;

  const { cache, client, persistor } = useContext(EbnisAppContext);
  const { layoutDispatch } = useContext(LayoutUnchangingContext);

  useLayoutEffect(() => {
    if (!isConnected()) {
      (navigate as NavigateFn)(REDIRECT_ROUTE);
      return;
    }
    setDocumentTitle(makeSiteTitle(UPLOAD_OFFLINE_ITEMS_TITLE));
    addUploadOfflineItemsResolvers(client);
    return setDocumentTitle;
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  useEffect(() => {
    if (getOfflineItems && dataLoaded.value === "no") {
      dispatch({
        type: ActionType.INIT_STATE_FROM_PROPS,
        getOfflineItems,
      });
    }
  }, [getOfflineItems, dataLoaded, navigate]);

  useEffect(() => {
    if (allCount === 0) {
      (navigate as NavigateFn)(REDIRECT_ROUTE);
      return;
    }
  }, [allCount, navigate]);

  useEffect(() => {
    if (shouldRedirect) {
      layoutDispatch({
        type: LayoutActionType.SET_OFFLINE_ITEMS_COUNT,
        count: 0,
      });

      (navigate as NavigateFn)(EXPERIENCES_URL);
    }
  }, [shouldRedirect, navigate, layoutDispatch]);

  useDeleteCachedQueriesMutationsOnExit(
    [
      "saveOfflineExperiences",
      "createEntries",
      "getOfflineItems",
      QUERY_NAME_getExperienceFull + "(",
    ],
    upload.value === "uploaded",
  );

  if (loading) {
    return <Loading />;
  }

  async function onSubmit() {
    dispatch({
      type: ActionType.UPLOAD_STARTED,
      isUploading: true,
    });

    try {
      let uploadFunction;
      let variables;

      if (completelyOfflineCount !== 0 && partlyOfflineCount !== 0) {
        uploadFunction = uploadAllUnsaveds;

        variables = {
          offlineExperiencesInput: completelyOfflineExperiencesToUploadData(
            completelyOfflineMap,
          ),

          offlineEntriesInput: onlineExperiencesToUploadData(partialOnlineMap),
        };
      } else if (completelyOfflineCount !== 0) {
        uploadFunction = uploadUnsavedExperiences;

        variables = ({
          input: completelyOfflineExperiencesToUploadData(completelyOfflineMap),
        } as unknown) as UploadOfflineItemsMutationVariables;
      } else {
        uploadFunction = uploadSavedExperiencesEntries;

        variables = ({
          input: onlineExperiencesToUploadData(partialOnlineMap),
        } as unknown) as UploadOfflineItemsMutationVariables;
      }

      const result = await (uploadFunction as UploadOfflineItemsMutationFn)({
        variables,
      });

      const newState = onUploadResultsReceived(
        stateMachine,
        result && result.data,
      );

      let outstandingOfflineCount: number | null = null;

      if (
        newState.states.upload.value === "uploaded" &&
        newState.states.upload.uploaded.states.experiences &&
        (newState.states.upload.uploaded.states
          .experiences as ExperiencesUploadedResultState).context.anySuccess
      ) {
        outstandingOfflineCount = updateCache({
          partialOnlineMap: newState.partialOnlineMap,
          completelyOfflineMap: newState.completelyOfflineMap,
          cache,
          client,
        });

        await persistor.persist();
      }

      dispatch({
        type: ActionType.UPLOAD_RESULTS_RECEIVED,
        stateMachine: newState,
      });

      if (outstandingOfflineCount !== null) {
        layoutDispatch({
          type: LayoutActionType.SET_OFFLINE_ITEMS_COUNT,
          count: outstandingOfflineCount,
        });
      }
    } catch (errors) {
      dispatch({
        type: ActionType.SERVER_ERROR,
        errors,
      });

      scrollIntoView("js-scroll-into-view-server-error");
    }
  }

  const serverErrors =
    (upload.value === "uploaded" &&
      upload.uploaded.states.apolloErrors &&
      upload.uploaded.states.apolloErrors.value === "active" &&
      upload.uploaded.states.apolloErrors.active.context.errors) ||
    null;

  const uploadSomeSuccess =
    (upload.value === "uploaded" && upload.uploaded.states.experiences) || null;

  const tabsValue = tabsState.value;
  const twoTabsValue = tabsState.value === "two" && tabsState.states.two.value;

  const offlineTabActive =
    (tabsValue === "one" && tabsState.context.offline) ||
    (twoTabsValue && twoTabsValue === CreationMode.offline);

  const onlineTabActive =
    (tabsValue === "one" && tabsState.context.online) ||
    (twoTabsValue && twoTabsValue === CreationMode.online);

  return (
    <div className="components-upload-offline-items">
      <ModalComponent open={upload.value === "uploading"} />

      <SidebarHeader sidebar={true}>
        <div className="components-upload-offline-items-header">
          <span>Offline Items Preview</span>

          {!(uploadSomeSuccess && uploadSomeSuccess.value === "allSuccess") && (
            <UploadAllButtonComponent onUploadAllClicked={onSubmit} />
          )}
        </div>
      </SidebarHeader>

      <div className="main">
        {tabsState.value !== "none" && (
          <TabsMenuComponent
            dispatch={dispatch}
            tabsState={tabsState}
            completelyOfflineCount={completelyOfflineCount}
            partlyOfflineCount={partlyOfflineCount}
            {...computeUploadedPartialState(uploadSomeSuccess)}
          />
        )}

        {serverErrors && (
          <ServerError dispatch={dispatch} errors={serverErrors} />
        )}

        <TransitionGroup className="offline-items">
          {onlineTabActive && (
            <CSSTransition
              timeout={timeoutMs}
              key="created-online-experiences"
              classNames="pane-animation-left"
            >
              <div
                className={makeClassNames({
                  tab: true,
                  active: onlineTabActive,
                })}
                id={createdOnlineExperiencesContainerId}
              >
                {Object.entries(partialOnlineMap).map(([id, map]) => {
                  return (
                    <ExperienceComponent
                      key={id}
                      mode={CreationMode.online}
                      experienceObjectMap={map}
                      dispatch={dispatch}
                    />
                  );
                })}
              </div>
            </CSSTransition>
          )}

          {offlineTabActive && (
            <CSSTransition
              timeout={timeoutMs}
              key="created-offline-experiences"
              classNames="pane-animation-right"
            >
              <div
                className={makeClassNames({
                  tab: true,
                  active: offlineTabActive,
                })}
                id={createdOfflineExperiencesContainerId}
              >
                {Object.entries(completelyOfflineMap).map(([id, map]) => {
                  return (
                    <ExperienceComponent
                      key={id}
                      mode={CreationMode.offline}
                      experienceObjectMap={map}
                      dispatch={dispatch}
                    />
                  );
                })}
              </div>
            </CSSTransition>
          )}
        </TransitionGroup>
      </div>
    </div>
  );
}

export default UploadOfflineItems;

////////////////////////// COMPONENTS ///////////////////////////////////

function ExperienceComponent({
  mode,
  experienceObjectMap,
  dispatch,
}: {
  experienceObjectMap: ExperienceObjectMap;
  mode: CreationMode;
  dispatch: DispatchType;
}) {
  const { client, cache } = useContext(EbnisAppContext);

  let {
    experience,
    newlySavedExperience,
    didUploadSucceed,
    offlineEntries,
    entriesErrors,
    experienceError,
  } = experienceObjectMap;

  experience = newlySavedExperience || experience;
  const hasError = !!(entriesErrors || experienceError);
  const experienceId = experience.id;
  const experienceClientId =
    mode === CreationMode.offline
      ? (experience.clientId as string)
      : experienceId;

  const [
    uploadStatusClassName,
    uploadStatusTitleClassName,
  ] = makeExperienceUploadStatusClassNames(didUploadSucceed, hasError);

  const iconProps: IconProps | null = didUploadSucceed
    ? {
        name: "check",
        className:
          "experience-title--success-icon upload-success-icon upload-result-icon",
        id: makeUploadStatusIconId(experienceClientId, "success"),
        "data-experience-id": experienceId,
      }
    : hasError
    ? {
        name: "ban",
        className:
          "experience-title--error-icon upload-error-icon upload-result-icon",
        id: makeUploadStatusIconId(experienceClientId, "error"),
      }
    : null;

  return (
    <Experience
      className={makeClassNames({
        [uploadStatusClassName]: !!uploadStatusClassName,
      })}
      experience={experience}
      headerProps={{
        id: makeExperienceComponentId(experienceId, mode),

        className: makeClassNames({
          "experience-title--uploads": true,
          [uploadStatusTitleClassName]: !!uploadStatusTitleClassName,
        }),

        children: iconProps ? <Icon {...iconProps} /> : null,
      }}
      menuOptions={{
        newEntry: false,
        onDelete: async () => {
          await replaceExperiencesInGetExperiencesMiniQuery(client, {
            [experienceId]: null,
          });

          deleteIdsFromCache(
            cache,
            [experienceId].concat(
              offlineEntries.map(e => e.clientId as string),
            ),
          );

          await deleteExperiencesIdsFromOfflineItemsInCache(client, [
            experienceId,
          ]);

          dispatch({
            type: ActionType.DELETE_EXPERIENCE,
            id: experienceId,
            mode,
          });
        },
      }}
      entriesJSX={offlineEntries.map((entry, index) => {
        const { id: entryId } = entry;

        const error = entriesErrors && entriesErrors[entryId];

        return (
          <Entry
            key={entryId}
            entry={entry}
            experience={experience}
            entriesLen={offlineEntries.length}
            index={index}
            id={makeEntryId(entryId)}
            className={makeClassNames({ "entry--error": !!error })}
          />
        );
      })}
    >
      {experienceError && (
        <FormCtrlError
          className="experience-error"
          id={makeExperienceErrorId(experienceId)}
        >
          <div>Error while saving experience ::</div>
          <div>{experienceError}</div>
        </FormCtrlError>
      )}
    </Experience>
  );
}

function ModalComponent({ open }: { open?: boolean }) {
  return (
    <Modal basic={true} size="small" open={open} dimmer="inverted">
      <Modal.Content>
        <Loading />
      </Modal.Content>
    </Modal>
  );
}

function TabsMenuComponent({
  dispatch,
  serverErrors,
  savedError,
  unsavedError,
  savedAllSuccess,
  unsavedAllSuccess,
  tabsState,
}: ComputeUploadPartialStateReturnValue & {
  dispatch: DispatchType;
  tabsState: TabsState;
} & Pick<StateMachine, "completelyOfflineCount" | "partlyOfflineCount">) {
  const { context, value: tabsValue } = tabsState;

  const twoTabsValue = tabsState.value === "two" && tabsState.states.two.value;
  const tabActive = tabsValue === "one";

  const partialOnlineUploadedIcon = savedAllSuccess ? (
    <Icon
      name="check"
      id="upload-triggered-success-icon-partly-saved"
      className="upload-success-icon upload-result-icon"
    />
  ) : serverErrors || savedError ? (
    <Icon
      name="ban"
      id="upload-triggered-error-icon-partly-saved"
      className="upload-error-icon upload-result-icon"
    />
  ) : null;

  const partlySavedTabIcon = context.online ? (
    <a
      className={makeClassNames({
        item: true,
        active: tabActive || twoTabsValue === CreationMode.online,
        "tab-menu": true,
      })}
      id="upload-unsaved-tab-menu-partly-saved"
      onClick={() => {
        if (twoTabsValue) {
          dispatch({
            type: ActionType.TOGGLE_TAB,
            currentValue: twoTabsValue,
          });
        }
      }}
    >
      Entries
      {partialOnlineUploadedIcon}
    </a>
  ) : null;

  const neverSavedUploadedIcon = unsavedAllSuccess ? (
    <Icon
      name="check"
      id="uploaded-success-tab-icon-never-saved"
      className="upload-success-icon upload-result-icon"
    />
  ) : serverErrors || unsavedError ? (
    <Icon
      name="ban"
      id="uploaded-error-tab-icon-never-saved"
      className="upload-error-icon upload-result-icon"
    />
  ) : null;

  const offlineExperiencesTabIcon = context.offline ? (
    <a
      className={makeClassNames({
        item: true,
        active: tabActive || twoTabsValue === CreationMode.offline,
        "tab-menu": true,
      })}
      id={offlineExperiencesTabMenuDomId}
      onClick={() => {
        if (twoTabsValue) {
          dispatch({
            type: ActionType.TOGGLE_TAB,
            currentValue: twoTabsValue,
          });
        }
      }}
    >
      Experiences
      {neverSavedUploadedIcon}
    </a>
  ) : null;

  return (
    <div
      className={makeClassNames({
        "ui item menu": true,
        [tabsValue]: true,
      })}
      id="upload-unsaved-tabs-menu"
    >
      {partlySavedTabIcon}

      {offlineExperiencesTabIcon}
    </div>
  );
}

function UploadAllButtonComponent({
  onUploadAllClicked,
}: {
  onUploadAllClicked: () => Promise<void>;
}) {
  return (
    <Button
      className="upload-button"
      id={uploadBtnDomId}
      onClick={onUploadAllClicked}
    >
      UPLOAD
    </Button>
  );
}

function ServerError(props: { dispatch: DispatchType; errors: string }) {
  const { errors, dispatch } = props;

  return (
    <Message
      style={{
        minHeight: "auto",
        position: "relative",
        marginTop: 0,
        marginLeft: "20px",
        marginRight: "20px",
      }}
      id="upload-unsaved-server-error"
      error={true}
      onDismiss={function onDismiss() {
        dispatch({
          type: ActionType.CLEAR_SERVER_ERRORS,
        });
      }}
    >
      <Message.Content>
        <span
          style={{
            position: "absolute",
            top: "-60px",
          }}
          id="js-scroll-into-view-server-error"
        />

        {errors}
      </Message.Content>
    </Message>
  );
}

////////////////////////// HELPER FUNCTIONS ///////////////////////////////////

function toUploadableEntry(entry: ExperienceFragment_entries_edges_node) {
  const dataObjects = entry.dataObjects.map(value => {
    const dataObject = value as DataObjectFragment;

    const keys: (keyof DataObjectFragment)[] = [
      "data",
      "definitionId",
      "clientId",
      "insertedAt",
      "updatedAt",
    ];

    return keys.reduce(
      (acc, k) => {
        acc[k as keyof DataObjectFragment] =
          dataObject[k as keyof DataObjectFragment];
        return acc;
      },
      {} as DataObjectFragment,
    );
  });

  return {
    experienceId: entry.experienceId,
    clientId: entry.clientId as string,
    dataObjects,
    insertedAt: entry.insertedAt,
    updatedAt: entry.updatedAt,
  };
}

function completelyOfflineExperiencesToUploadData(
  experiencesIdsToObjectMap: ExperiencesIdsToObjectMap,
) {
  return Object.values(experiencesIdsToObjectMap).map(
    ({ experience, offlineEntries }) => {
      return {
        entries: offlineEntries.map(toUploadableEntry),
        title: experience.title,
        clientId: experience.clientId,
        dataDefinitions: experience.dataDefinitions.map(
          definitionToUnsavedData,
        ),
        insertedAt: experience.insertedAt,
        updatedAt: experience.updatedAt,
        description: experience.description,
      };
    },
  );
}

function onlineExperiencesToUploadData(
  experiencesIdsToObjectMap: ExperiencesIdsToObjectMap,
) {
  return Object.entries(experiencesIdsToObjectMap).reduce(
    (acc, [, { offlineEntries }]) => {
      return acc.concat(offlineEntries.map(toUploadableEntry));
    },
    [] as CreateEntriesInput[],
  );
}

function computeUploadedPartialState(
  uploadSomeSuccess: ExperiencesUploadedState | null,
): ComputeUploadPartialStateReturnValue {
  if (uploadSomeSuccess) {
    const { value } = uploadSomeSuccess;

    if (value === "serverError") {
      return {
        serverErrors: true,
      };
    } else {
      const {
        states: { saved, offline },
      } = (uploadSomeSuccess as PartialUploadSuccessState).partial;

      return {
        savedError: saved && saved.value !== "allSuccess",
        unsavedError: offline && offline.value !== "allSuccess",
        savedAllSuccess: saved && saved.value === "allSuccess",
        unsavedAllSuccess: offline && offline.value === "allSuccess",
      };
    }
  }

  return {};
}

////////////////////////// END HELPER FUNCTIONS //////////////////////////////

////////////////////////// TYPES ///////////////////////////////////

interface ComputeUploadPartialStateReturnValue {
  serverErrors?: boolean;
  savedError?: boolean;
  unsavedError?: boolean;
  savedAllSuccess?: boolean;
  unsavedAllSuccess?: boolean;
}
