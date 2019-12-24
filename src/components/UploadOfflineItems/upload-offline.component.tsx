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
import { deleteExperiencesIdsFromAllExperiencesInCache } from "../../state/resolvers/update-experiences-in-cache";
import { EXPERIENCES_URL } from "../../routes";
import { updateCache } from "./update-cache";
import { useDeleteMutationsOnExit } from "../use-delete-mutations-on-exit";
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
import { makeCompletelyOfflineExperienceTitleId } from "./upload-offline.dom";

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
    partlyOfflineMap,
    completelyOfflineMap,
    shouldRedirect,
    states: { upload, dataLoaded, tabs: tabsState },
    context: { allCount },
  } = stateMachine;

  const { cache, client, persistor } = useContext(EbnisAppContext);
  const { layoutDispatch } = useContext(LayoutUnchangingContext);

  useLayoutEffect(() => {
    addUploadOfflineItemsResolvers(client);
  }, [client]);

  useEffect(
    function setCompTitle() {
      if (!isConnected()) {
        (navigate as NavigateFn)(REDIRECT_ROUTE);
        return;
      }

      setDocumentTitle(makeSiteTitle(UPLOAD_OFFLINE_ITEMS_TITLE));

      return setDocumentTitle;
    },
    [navigate],
  );

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
        type: LayoutActionType.SET_UNSAVED_COUNT,
        count: 0,
      });

      (navigate as NavigateFn)(EXPERIENCES_URL);
    }
  }, [shouldRedirect, navigate, layoutDispatch]);

  useDeleteMutationsOnExit(
    ["saveOfflineExperiences", "createEntries", "getOfflineItems"],
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
          offlineExperiencesInput: unsavedExperiencesToUploadData(
            completelyOfflineMap,
          ),

          offlineEntriesInput: savedExperiencesToUploadData(partlyOfflineMap),
        };
      } else if (completelyOfflineCount !== 0) {
        uploadFunction = uploadUnsavedExperiences;

        variables = ({
          input: unsavedExperiencesToUploadData(completelyOfflineMap),
        } as unknown) as UploadOfflineItemsMutationVariables;
      } else {
        uploadFunction = uploadSavedExperiencesEntries;

        variables = ({
          input: savedExperiencesToUploadData(partlyOfflineMap),
        } as unknown) as UploadOfflineItemsMutationVariables;
      }

      const result = await (uploadFunction as UploadOfflineItemsMutationFn)({
        variables,
      });

      const newState = onUploadResultsReceived(
        stateMachine,
        result && result.data,
      );

      let outstandingUnsavedCount: number | null = null;

      if (
        newState.states.upload.value === "uploaded" &&
        newState.states.upload.uploaded.states.experiences &&
        (newState.states.upload.uploaded.states
          .experiences as ExperiencesUploadedResultState).context.anySuccess
      ) {
        outstandingUnsavedCount = updateCache({
          partlyOfflineMap: newState.partlyOfflineMap,
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

      if (outstandingUnsavedCount !== null) {
        layoutDispatch({
          type: LayoutActionType.SET_UNSAVED_COUNT,
          count: outstandingUnsavedCount,
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

  const partlySavedTabActive =
    (tabsValue === "one" && tabsState.context.partlySaved) ||
    (twoTabsValue && twoTabsValue === "partlySaved");

  const neverSavedTabActive =
    (tabsValue === "one" && tabsState.context.neverSaved) ||
    (twoTabsValue && twoTabsValue === "neverSaved");

  return (
    <div className="components-upload-unsaved">
      <ModalComponent open={upload.value === "uploading"} />

      <SidebarHeader sidebar={true}>
        <div className="components-upload-unsaved-header">
          <span>Unsaved Preview</span>

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

        <TransitionGroup className="all-unsaveds">
          {partlySavedTabActive && (
            <CSSTransition
              timeout={timeoutMs}
              key="saved-experiences"
              classNames="pane-animation-left"
            >
              <div
                className={makeClassNames({
                  tab: true,
                  active: partlySavedTabActive,
                })}
                id="upload-unsaved-container-partly-saved"
              >
                {Object.entries(partlyOfflineMap).map(([id, map]) => {
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

          {neverSavedTabActive && (
            <CSSTransition
              timeout={timeoutMs}
              key="unsaved-experiences"
              classNames="pane-animation-right"
            >
              <div
                className={makeClassNames({
                  tab: true,
                  active: neverSavedTabActive,
                })}
                id="upload-unsaved-container-never-saved"
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
  const hasError = entriesErrors || experienceError;

  const experienceId = experience.id;
  const typePrefix = mode + "-experience";
  let uploadStatusIndicatorSuffix = "";
  let experienceClassName = "";

  let iconProps: IconProps | null = null;

  if (didUploadSucceed) {
    uploadStatusIndicatorSuffix = "--success";
    experienceClassName = typePrefix + uploadStatusIndicatorSuffix;

    iconProps = {
      name: "check",
      className:
        "experience-title__success-icon upload-success-icon upload-result-icon",
      id: "upload-triggered-icon-success-" + experienceId,
    };
  } else if (hasError) {
    uploadStatusIndicatorSuffix = "--error";
    experienceClassName = typePrefix + uploadStatusIndicatorSuffix;

    iconProps = {
      name: "ban",
      className:
        "experience-title__error-icon upload-error-icon upload-result-icon",
      id: "upload-triggered-icon-error-" + experienceId,
    };
  }

  return (
    <Experience
      className={experienceClassName}
      experience={experience}
      headerProps={{
        id: makeCompletelyOfflineExperienceTitleId(experienceId, mode),
        className: `experience-title--uploads experience-title${uploadStatusIndicatorSuffix}`,

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

          await deleteExperiencesIdsFromAllExperiencesInCache(client, [
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
            id={`upload-unsaved-entry-${entryId}`}
            className={makeClassNames({ "entry--error": !!error })}
          />
        );
      })}
    >
      {experienceError && (
        <FormCtrlError
          className="experience-error"
          id={`unsaved-experience-errors-${experienceId}`}
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

  const partlySavedUploadedIcon = savedAllSuccess ? (
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

  const partlySavedTabIcon = context.partlySaved ? (
    <a
      className={makeClassNames({
        item: true,
        active: tabActive || twoTabsValue === "partlySaved",
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
      {partlySavedUploadedIcon}
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

  const neverSavedTabIcon = context.neverSaved ? (
    <a
      className={makeClassNames({
        item: true,
        active: tabActive || twoTabsValue === "neverSaved",
        "tab-menu": true,
      })}
      id="upload-unsaved-tab-menu-never-saved"
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

      {neverSavedTabIcon}
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
      id="upload-unsaved-upload-btn"
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

function unsavedExperiencesToUploadData(
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

function savedExperiencesToUploadData(
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
