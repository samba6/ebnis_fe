import React, {
  useReducer,
  useEffect,
  useContext,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  ComponentProps,
  reducer,
  ActionType,
  DispatchType,
  StateMachine,
  initState,
  ExperienceObjectMap,
  StateValue,
  PartialUploadSuccessState,
  ExperiencesUploadedState,
  TabsState,
  CreationMode,
  CallerProps,
  effectFunctions,
} from "./upload-offline.utils";
import { Loading } from "../Loading/loading";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import "./upload-offline.styles.scss";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import makeClassNames from "classnames";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { isConnected } from "../../state/connections";
import { NavigateFn } from "@reach/router";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Experience from "../Experience/experience.component";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import { Entry } from "../Entry/entry.component";
import {
  LayoutActionType,
  LayoutUnchangingContext,
} from "../Layout/layout.utils";
import { EXPERIENCES_URL } from "../../routes";
import { makeSiteTitle, setDocumentTitle } from "../../constants";
import { UPLOAD_OFFLINE_ITEMS_TITLE } from "../../constants/upload-offline-title";
import { IconProps } from "semantic-ui-react";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { EbnisAppContext } from "../../context";
import {
  makeExperienceComponentId,
  createdOnlineExperiencesContainerId,
  createdOfflineExperiencesContainerId,
  makeExperienceUploadStatusClassNames,
  makeUploadStatusIconId,
  makeEntryDomId,
  makeExperienceErrorId,
  uploadBtnDomId,
  offlineExperiencesTabMenuDomId,
} from "./upload-offline.dom";
import { QUERY_NAME_getExperienceFull } from "../../graphql/get-experience-full.query";
import { useCreateEntriesMutation } from "../../graphql/create-entries.mutation";
import { cleanupRanQueriesFromCache } from "../../apollo-cache/cleanup-ran-queries-from-cache";
import {
  useUploadOfflineExperiencesMutation,
  useUploadOfflineItemsMutation,
} from "../../graphql/upload-offline-items.mutation";
import {
  getAllOfflineItemsResolvers,
  useGetAllOfflineItemsQuery,
  QUERY_NAME_getOfflineItems,
} from "./upload-offline.resolvers";

const timeoutMs = 500;
const REDIRECT_ROUTE = makeSiteTitle(MY_EXPERIENCES_TITLE);

export function UploadOfflineItemsComponent(props: ComponentProps) {
  const {
    navigate,
    layoutDispatch,
    cache,
    client,
    persistor,
    loading,
    allOfflineItems,
  } = props;

  const [stateMachine, dispatch] = useReducer(
    reducer,
    allOfflineItems,
    initState,
  );

  const {
    states: { upload, dataLoaded, tabs: tabsState },
    context: {
      allCount,
      completelyOfflineCount,
      partlyOfflineCount,
      partialOnlineMap,
      completelyOfflineMap,
      shouldRedirect,
    },
    effects: { general },
  } = stateMachine;

  useEffect(() => {
    if (general.value === StateValue.yes) {
      const {
        yes: { effects },
      } = general;

      effects.forEach(({ key, ownArgs }) => {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any*/
        effectFunctions[key](ownArgs as any, props, { dispatch });
      });
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, [general]);

  useLayoutEffect(() => {
    if (!isConnected()) {
      (navigate as NavigateFn)(REDIRECT_ROUTE);
      return;
    }
    setDocumentTitle(makeSiteTitle(UPLOAD_OFFLINE_ITEMS_TITLE));
    client.addResolvers(getAllOfflineItemsResolvers);
    return () => {
      cleanupRanQueriesFromCache(
        cache,
        [
          // why remove here when we already removing from ./update-cache?
          // because we only trigger update-cache when we submit and what if
          // user leaves this component without submitting.
          QUERY_NAME_getOfflineItems,
          QUERY_NAME_getExperienceFull + "(",
        ],
        persistor,
      );
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps*/
  }, []);

  const dataNotLoaded = dataLoaded.value === StateValue.no;
  // istanbul ignore next: no easy way to test
  useEffect(() => {
    if (dataNotLoaded && allOfflineItems) {
      dispatch({
        type: ActionType.ON_DATA_LOADED,
        allOfflineItems,
      });
    }
  }, [allOfflineItems, dataNotLoaded]);

  useEffect(() => {
    if (!dataNotLoaded && allCount === 0) {
      (navigate as NavigateFn)(REDIRECT_ROUTE);
      return;
    }
  }, [allCount, navigate, dataNotLoaded]);

  useEffect(() => {
    if (shouldRedirect) {
      layoutDispatch({
        type: LayoutActionType.SET_OFFLINE_ITEMS_COUNT,
        count: 0,
      });

      (navigate as NavigateFn)(EXPERIENCES_URL);
    }
  }, [shouldRedirect, navigate, layoutDispatch]);

  const onSubmit = useCallback(() => {
    dispatch({
      type: ActionType.ON_UPLOAD,
    });
  }, []);

  if (loading) {
    return <Loading />;
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
    (twoTabsValue && twoTabsValue === StateValue.offline);

  const onlineTabActive =
    (tabsValue === "one" && tabsState.context.online) ||
    (twoTabsValue && twoTabsValue === StateValue.online);

  return (
    <div className="components-upload-offline-items">
      {upload.value === StateValue.uploading && <Loading />}

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
                      mode={StateValue.online}
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
                      mode={StateValue.offline}
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
  const {
    newlySavedExperience: newOnlineExperience,
    didUploadSucceed,
    // note that on upload success, offlineEntries will include online entries
    offlineEntries,
    entriesErrors,
    experienceError,
  } = experienceObjectMap;

  let { experience } = experienceObjectMap;

  // when the experience is now offline, we display it instead of the offline
  // version
  experience = newOnlineExperience || experience;
  const hasError = !!(entriesErrors || experienceError);
  const experienceId = experience.id;
  const experienceClientId =
    mode === StateValue.offline
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
      // upload-experience-status--error
      // upload-experience-status--success
      className={makeClassNames({
        [uploadStatusClassName]: !!uploadStatusClassName,
      })}
      experience={experience}
      headerProps={{
        id: makeExperienceComponentId(experienceId, mode),

        className: makeClassNames({
          "experience-title--uploads": true,
          // experience-title--success
          [uploadStatusTitleClassName]: !!uploadStatusTitleClassName,
        }),

        children: iconProps ? <Icon {...iconProps} /> : null,
      }}
      menuOptions={{
        newEntry: false,
        onDelete: () => {
          dispatch({
            type: ActionType.ON_DELETE_EXPERIENCE,
            experienceId,
            mode,
            offlineEntries,
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
            id={makeEntryDomId(entryId)}
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
} & Pick<
    StateMachine["context"],
    "completelyOfflineCount" | "partlyOfflineCount"
  >) {
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
        active: tabActive || twoTabsValue === StateValue.online,
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
        active: tabActive || twoTabsValue === StateValue.offline,
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
  onUploadAllClicked: () => void;
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

// istanbul ignore next:
export default (props: CallerProps) => {
  const [createEntries] = useCreateEntriesMutation();
  const { layoutDispatch } = useContext(LayoutUnchangingContext);
  const { cache, client, persistor } = useContext(EbnisAppContext);
  const [uploadAllOfflineItems] = useUploadOfflineItemsMutation();
  const [uploadOfflineExperiences] = useUploadOfflineExperiencesMutation();

  const { data, loading } = useGetAllOfflineItemsQuery();
  const allOfflineItems = data && data.getOfflineItems;

  return (
    <UploadOfflineItemsComponent
      layoutDispatch={layoutDispatch}
      createEntries={createEntries}
      client={client}
      cache={cache}
      persistor={persistor}
      uploadAllOfflineItems={uploadAllOfflineItems}
      uploadOfflineExperiences={uploadOfflineExperiences}
      loading={loading}
      allOfflineItems={allOfflineItems}
      {...props}
    />
  );
};
