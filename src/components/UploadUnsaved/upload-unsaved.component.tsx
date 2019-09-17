import React, { useReducer, useEffect, useContext } from "react";
import {
  Props,
  reducer,
  ActionType,
  definitionToUnsavedData,
  ExperiencesIdsToObjectMap,
  DispatchType,
  State,
  stateInitializerFn,
  ExperienceObjectMap,
  SaveStatusType,
  onUploadResult,
} from "./upload-unsaved.utils";
import { Loading } from "../Loading/loading";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { ExperienceFragment_entries_edges_node } from "../../graphql/apollo-types/ExperienceFragment";
import "./upload-unsaved.styles.scss";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import makeClassNames from "classnames";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { CreateEntriesInput } from "../../graphql/apollo-types/globalTypes";
import { UploadAllUnsavedsMutationFn } from "../../graphql/upload-unsaveds.mutation";
import { isConnected } from "../../state/connections";
import { NavigateFn } from "@reach/router";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import { UploadAllUnsavedsMutationVariables } from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
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
import { deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache } from "../../state/resolvers/update-saved-and-unsaved-experiences-in-cache";
import { EXPERIENCES_URL } from "../../routes";
import { updateCache } from "./update-cache";
import { useDeleteMutationsOnExit } from "../use-delete-mutations-on-exit";
import { makeSiteTitle, setDocumentTitle } from "../../constants";
import { UPLOAD_UNSAVED_TITLE } from "../../constants/upload-unsaved-title";
import { IconProps } from "semantic-ui-react";
import { DataObjectFragment } from "../../graphql/apollo-types/DataObjectFragment";
import { MY_EXPERIENCES_TITLE } from "../../constants/my-experiences-title";
import { EbnisAppContext } from "../../context";
import {
  useGetAllUnsavedQuery,
  useUploadUnsavedExperiencesMutation,
  useUploadAllUnsavedsMutation,
  useUploadSavedExperiencesEntriesMutation,
  addUploadUnsavedResolvers,
} from "./upload-unsaved.injectables";

const timeoutMs = 500;
const REDIRECT_ROUTE = makeSiteTitle(MY_EXPERIENCES_TITLE);

export function UploadUnsaved(props: Props) {
  const { navigate } = props;
  const [uploadUnsavedExperiences] = useUploadUnsavedExperiencesMutation();
  const [uploadAllUnsaveds] = useUploadAllUnsavedsMutation();

  const [
    uploadSavedExperiencesEntries,
  ] = useUploadSavedExperiencesEntriesMutation();

  const { data, loading } = useGetAllUnsavedQuery();
  const getAllUnsaved = data && data.getAllUnsaved;

  const [state, dispatch] = useReducer(
    reducer,
    getAllUnsaved,
    stateInitializerFn,
  );

  const {
    tabs,
    uploading,
    serverError,
    allUploadSucceeded,
    unsavedExperiencesLen,
    savedExperiencesLen,
    savedExperiencesMap,
    unsavedExperiencesMap,
    shouldRedirect,
  } = state;

  const { cache, client, persistor } = useContext(EbnisAppContext);
  const { layoutDispatch } = useContext(LayoutUnchangingContext);

  useEffect(() => {
    addUploadUnsavedResolvers(client);
  }, [client]);

  useEffect(
    function setCompTitle() {
      if (!isConnected()) {
        (navigate as NavigateFn)(REDIRECT_ROUTE);
        return;
      }

      setDocumentTitle(makeSiteTitle(UPLOAD_UNSAVED_TITLE));

      return setDocumentTitle;
    },
    [navigate],
  );

  useEffect(() => {
    if (getAllUnsaved) {
      const count =
        getAllUnsaved.savedExperiencesLen + getAllUnsaved.unsavedExperiencesLen;

      if (count === 0) {
        (navigate as NavigateFn)(REDIRECT_ROUTE);
        return;
      }

      dispatch([ActionType.initStateFromProps, getAllUnsaved]);
    }
  }, [getAllUnsaved, navigate]);

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
    ["saveOfflineExperiences", "createEntries"],
    state.hasSavedExperiencesUploadError !== null,
  );

  async function onSubmit() {
    dispatch([ActionType.setUploading, true]);

    try {
      let uploadFunction;
      let variables;

      if (unsavedExperiencesLen !== 0 && savedExperiencesLen !== 0) {
        uploadFunction = uploadAllUnsaveds;

        variables = {
          unsavedExperiencesInput: unsavedExperiencesToUploadData(
            unsavedExperiencesMap,
          ),

          unsavedEntriesInput: savedExperiencesToUploadData(
            savedExperiencesMap,
          ),
        };
      } else if (unsavedExperiencesLen !== 0) {
        uploadFunction = uploadUnsavedExperiences;

        variables = ({
          input: unsavedExperiencesToUploadData(unsavedExperiencesMap),
        } as unknown) as UploadAllUnsavedsMutationVariables;
      } else {
        uploadFunction = uploadSavedExperiencesEntries;

        variables = ({
          input: savedExperiencesToUploadData(savedExperiencesMap),
        } as unknown) as UploadAllUnsavedsMutationVariables;
      }

      const result = await (uploadFunction as UploadAllUnsavedsMutationFn)({
        variables,
      });

      const newState = onUploadResult(state, result && result.data);

      let outstandingUnsavedCount: number | null = null;

      if (newState.atLeastOneUploadSucceeded) {
        outstandingUnsavedCount = updateCache({
          savedExperiencesMap: newState.savedExperiencesMap,
          unsavedExperiencesMap: newState.unsavedExperiencesMap,
          cache,
          client,
        });

        await persistor.persist();
      }

      dispatch([ActionType.onUploadResult, newState]);

      if (outstandingUnsavedCount !== null) {
        layoutDispatch({
          type: LayoutActionType.SET_UNSAVED_COUNT,
          count: outstandingUnsavedCount,
        });
      }
    } catch (error) {
      dispatch([ActionType.setServerError, error]);

      scrollIntoView("js-scroll-into-view-server-error");
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="components-upload-unsaved">
      <ModalComponent open={uploading} />

      <SidebarHeader sidebar={true}>
        <div className="components-upload-unsaved-header">
          <span>Unsaved Preview</span>

          <UploadAllButtonComponent
            onUploadAllClicked={onSubmit}
            allUploadSucceeded={allUploadSucceeded}
          />
        </div>
      </SidebarHeader>

      <div className="main">
        <TabsMenuComponent state={state} dispatch={dispatch} />

        <ServerError dispatch={dispatch} serverError={serverError} />

        <TransitionGroup className="all-unsaveds">
          {tabs["1"] && (
            <CSSTransition
              timeout={timeoutMs}
              key="saved-experiences"
              classNames="pane-animation-left"
            >
              <div
                className={makeClassNames({ tab: true, active: tabs["1"] })}
                id="upload-unsaved-saved-experiences-container"
              >
                {Object.entries(savedExperiencesMap).map(([id, map]) => {
                  return (
                    <ExperienceComponent
                      key={id}
                      type="saved"
                      experienceObjectMap={map}
                      dispatch={dispatch}
                    />
                  );
                })}
              </div>
            </CSSTransition>
          )}

          {tabs["2"] && (
            <CSSTransition
              timeout={timeoutMs}
              key="unsaved-experiences"
              classNames="pane-animation-right"
            >
              <div
                className={makeClassNames({ tab: true, active: tabs["2"] })}
                id="upload-unsaved-unsaved-experiences-container"
              >
                {Object.entries(unsavedExperiencesMap).map(([id, map]) => {
                  return (
                    <ExperienceComponent
                      key={id}
                      type="unsaved"
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

export default UploadUnsaved;

////////////////////////// COMPONENTS ///////////////////////////////////

function ExperienceComponent({
  type,
  experienceObjectMap,
  dispatch,
}: {
  experienceObjectMap: ExperienceObjectMap;
  type: SaveStatusType;
  dispatch: DispatchType;
}) {
  const { client, cache } = useContext(EbnisAppContext);

  let {
    experience,
    newlySavedExperience,
    didUploadSucceed,
    unsavedEntries,
    entriesErrors,
    experienceError,
  } = experienceObjectMap;

  experience = newlySavedExperience || experience;
  const hasError = entriesErrors || experienceError;

  const experienceId = experience.id;
  const typePrefix = type + "-experience";
  let uploadStatusIndicatorSuffix = "";
  let experienceClassName = "";
  const idPrefix = `${typePrefix}-${experienceId}`;

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
        id: `upload-unsaved-${idPrefix}-title`,
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
              unsavedEntries.map(e => e.clientId as string),
            ),
          );

          await deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache(
            client,
            [experienceId],
          );

          dispatch([ActionType.experienceDeleted, { id: experienceId, type }]);
        },
      }}
      entriesJSX={unsavedEntries.map((entry, index) => {
        const { id: entryId } = entry;

        const error = entriesErrors && entriesErrors[entryId];

        return (
          <Entry
            key={entryId}
            entry={entry}
            experience={experience}
            entriesLen={unsavedEntries.length}
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
  state,
}: {
  dispatch: DispatchType;
  state: State;
}) {
  const {
    hasUnsavedExperiencesUploadError,
    hasSavedExperiencesUploadError,
    tabs,
    unsavedExperiencesLen,
    savedExperiencesLen,
  } = state;

  let unsavedUploadTriggeredIcon = null;
  let savedUploadTriggeredIcon = null;

  let unsavedIcon = null;
  let savedIcon = null;

  if (savedExperiencesLen > 0) {
    if (hasSavedExperiencesUploadError === true) {
      savedUploadTriggeredIcon = (
        <Icon
          name="ban"
          id="upload-triggered-icon-error-saved-experiences"
          className="upload-error-icon upload-result-icon"
        />
      );
    } else if (hasSavedExperiencesUploadError === false) {
      savedUploadTriggeredIcon = (
        <Icon
          name="check"
          id="upload-triggered-icon-success-saved-experiences"
          className="upload-success-icon upload-result-icon"
        />
      );
    }

    savedIcon = (
      <a
        className={setTabMenuClassNames("1", tabs)}
        id="upload-unsaved-saved-experiences-menu"
        onClick={() => dispatch([ActionType.toggleTab, 1])}
      >
        Entries
        {savedUploadTriggeredIcon}
      </a>
    );
  }

  if (unsavedExperiencesLen > 0) {
    if (hasUnsavedExperiencesUploadError === true) {
      unsavedUploadTriggeredIcon = (
        <Icon
          name="ban"
          id="upload-triggered-icon-error-unsaved-experiences"
          className="upload-error-icon upload-result-icon"
        />
      );
    } else if (hasUnsavedExperiencesUploadError === false) {
      unsavedUploadTriggeredIcon = (
        <Icon
          name="check"
          id="upload-triggered-icon-success-unsaved-experiences"
          className="upload-success-icon upload-result-icon"
        />
      );
    }

    unsavedIcon = (
      <a
        className={setTabMenuClassNames("2", tabs)}
        id="upload-unsaved-unsaved-experiences-menu"
        onClick={() => dispatch([ActionType.toggleTab, 2])}
      >
        Experiences
        {unsavedUploadTriggeredIcon}
      </a>
    );
  }

  return (
    <div
      className={makeClassNames({
        "ui item menu": true,
        one: savedIcon === null || unsavedIcon === null,
        two: savedIcon !== null && unsavedIcon !== null,
      })}
      id="upload-unsaved-tabs-menu"
    >
      {savedIcon}

      {unsavedIcon}
    </div>
  );
}

function UploadAllButtonComponent({
  onUploadAllClicked,
  allUploadSucceeded,
}: {
  onUploadAllClicked: () => Promise<void>;
  allUploadSucceeded?: boolean;
}) {
  if (allUploadSucceeded) {
    return null;
  }

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

function ServerError(props: {
  dispatch: DispatchType;
  serverError: State["serverError"];
}) {
  const { serverError, dispatch } = props;

  if (!serverError) {
    return null;
  }

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
        dispatch([ActionType.removeServerErrors]);
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

        {serverError}
      </Message.Content>
    </Message>
  );
}

////////////////////////// END COMPONENTS ///////////////////////////////////

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
    ({ experience, unsavedEntries }) => {
      return {
        entries: unsavedEntries.map(toUploadableEntry),
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
    (acc, [, { unsavedEntries }]) => {
      return acc.concat(unsavedEntries.map(toUploadableEntry));
    },
    [] as CreateEntriesInput[],
  );
}

function setTabMenuClassNames(tabNumber: string | number, tabs: State["tabs"]) {
  return makeClassNames({
    item: true,
    active: tabs[tabNumber],
    "tab-menu": true,
  });
}

////////////////////////// END HELPER FUNCTIONS //////////////////////////////

////////////////////////// TYPES ///////////////////////////////////
