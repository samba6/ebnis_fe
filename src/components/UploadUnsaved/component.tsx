import React, { useReducer, useEffect, useContext } from "react";
import {
  Props,
  reducer,
  ActionType,
  fieldDefToUnsavedData,
  ExperiencesIdsToObjectMap,
  DispatchType,
  State,
  stateInitializerFn,
  ExperienceObjectMap,
  SaveStatusType,
  onUploadResult,
} from "./utils";
import { Loading } from "../Loading";
import { SidebarHeader } from "../SidebarHeader";
import {
  ExperienceFragment_entries_edges_node,
  ExperienceFragment_entries_edges_node_fields,
  ExperienceFragment_fieldDefs,
} from "../../graphql/apollo-types/ExperienceFragment";
import "./styles.scss";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import makeClassNames from "classnames";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import { CreateEntryInput } from "../../graphql/apollo-types/globalTypes";
import { UploadAllUnsavedsMutationFn } from "../../graphql/upload-unsaveds.mutation";
import { getConnStatus } from "../../state/get-conn-status";
import { NavigateFn } from "@reach/router";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import { UploadAllUnsavedsMutationVariables } from "../../graphql/apollo-types/UploadAllUnsavedsMutation";
import { Experience } from "../Experience/component";
import { scrollIntoView } from "../scroll-into-view";
import { FormCtrlError } from "../FormCtrlError/component";
import { Entry } from "../Entry/component";
import { GetAllUnSavedQueryData } from "../../state/unsaved-resolvers";
import { LayoutContext, LayoutActionType } from "../Layout/utils";
import { replaceExperiencesInGetExperiencesMiniQuery } from "../../state/resolvers/update-get-experiences-mini-query";
import { deleteIdsFromCache } from "../../state/resolvers/delete-references-from-cache";
import { deleteExperiencesIdsFromSavedAndUnsavedExperiencesInCache } from "../../state/resolvers/update-saved-and-unsaved-experiences-in-cache";
import { EXPERIENCES_URL } from "../../routes";
import { updateCache } from "./update-cache";
import { useDeleteMutationsOnExit } from "../use-delete-mutations-on-exit";
import { makeSiteTitle, setDocumentTitle } from "../../constants";
import { UPLOAD_UNSAVED_TITLE } from "../../constants/upload-unsaved-title";
import { IconProps } from "semantic-ui-react";

const timeoutMs = 500;

export function UploadUnsaved(props: Props) {
  const {
    getAllUnsavedProps: {
      loading,
      getAllUnsaved,
    } = {} as GetAllUnSavedQueryData,

    uploadUnsavedExperiences,
    createEntries,
    uploadAllUnsaveds,
    navigate,
  } = props;

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

  const { cache, layoutDispatch, client, persistor } = useContext(
    LayoutContext,
  );

  useEffect(function setCompTitle() {
    getConnStatus(client).then(isConnected => {
      if (!isConnected) {
        (navigate as NavigateFn)("/404");
        return;
      }
    });

    setDocumentTitle(makeSiteTitle(UPLOAD_UNSAVED_TITLE));

    return setDocumentTitle;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (getAllUnsaved) {
      const count =
        getAllUnsaved.savedExperiencesLen + getAllUnsaved.unsavedExperiencesLen;

      if (count === 0) {
        (navigate as NavigateFn)("/404");
        return;
      }

      dispatch([ActionType.initStateFromProps, getAllUnsaved]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAllUnsaved]);

  useEffect(() => {
    if (shouldRedirect) {
      layoutDispatch([LayoutActionType.setUnsavedCount, 0]);

      (navigate as NavigateFn)(EXPERIENCES_URL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldRedirect]);

  useDeleteMutationsOnExit(
    ["saveOfflineExperiences", "createEntries"],
    state.hasSavedExperiencesUploadError !== null,
  );

  async function onUploadAllClicked() {
    dispatch([ActionType.setUploading, true]);

    try {
      let uploadFunction;
      let variables;

      if (unsavedExperiencesLen !== 0 && savedExperiencesLen !== 0) {
        uploadFunction = uploadAllUnsaveds;

        variables = {
          unsavedExperiences: unsavedExperiencesToUploadData(
            unsavedExperiencesMap,
          ),

          unsavedEntries: savedExperiencesToUploadData(savedExperiencesMap),
        };
      } else if (unsavedExperiencesLen !== 0) {
        uploadFunction = uploadUnsavedExperiences;

        variables = ({
          input: unsavedExperiencesToUploadData(unsavedExperiencesMap),
        } as unknown) as UploadAllUnsavedsMutationVariables;
      } else {
        uploadFunction = createEntries;

        variables = ({
          createEntries: savedExperiencesToUploadData(savedExperiencesMap),
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
        layoutDispatch([
          LayoutActionType.setUnsavedCount,
          outstandingUnsavedCount,
        ]);
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
            onUploadAllClicked={onUploadAllClicked}
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
                data-testid="saved-experiences"
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
                data-testid="unsaved-experiences"
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
  const { client, cache } = useContext(LayoutContext);

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
  const dataTestId = `${typePrefix}-${experienceId}`;

  let iconProps: IconProps | null = null;

  if (didUploadSucceed) {
    uploadStatusIndicatorSuffix = "--success";
    experienceClassName = typePrefix + uploadStatusIndicatorSuffix;

    iconProps = {
      name: "check",
      className:
        "experience-title__success-icon upload-success-icon upload-result-icon",
      "data-testid": "upload-triggered-icon-success-" + experienceId,
    };
  } else if (hasError) {
    uploadStatusIndicatorSuffix = "--error";
    experienceClassName = typePrefix + uploadStatusIndicatorSuffix;

    iconProps = {
      name: "ban",
      className:
        "experience-title__error-icon upload-error-icon upload-result-icon",
      "data-testid": "upload-triggered-icon-error-" + experienceId,
    };
  }

  return (
    <Experience
      className={experienceClassName}
      experience={experience}
      data-testid={typePrefix}
      headerProps={{
        "data-testid": dataTestId + "-title",
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
            fieldDefs={experience.fieldDefs as ExperienceFragment_fieldDefs[]}
            entriesLen={unsavedEntries.length}
            index={index}
            data-testid={`entry-${entryId}`}
            className={makeClassNames({ "entry--error": !!error })}
          />
        );
      })}
    >
      {experienceError && (
        <FormCtrlError
          className="experience-error"
          data-testid={`unsaved-experience-errors-${experienceId}`}
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
    <Modal
      data-testid="uploading-data"
      basic={true}
      size="small"
      open={open}
      dimmer="inverted"
    >
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
          data-testid="upload-triggered-icon-error-saved-experiences"
          className="upload-error-icon upload-result-icon"
        />
      );
    } else if (hasSavedExperiencesUploadError === false) {
      savedUploadTriggeredIcon = (
        <Icon
          name="check"
          data-testid="upload-triggered-icon-success-saved-experiences"
          className="upload-success-icon upload-result-icon"
        />
      );
    }

    savedIcon = (
      <a
        className={setTabMenuClassNames("1", tabs)}
        data-testid="saved-experiences-menu"
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
          data-testid="upload-triggered-icon-error-unsaved-experiences"
          className="upload-error-icon upload-result-icon"
        />
      );
    } else if (hasUnsavedExperiencesUploadError === false) {
      unsavedUploadTriggeredIcon = (
        <Icon
          name="check"
          data-testid="upload-triggered-icon-success-unsaved-experiences"
          className="upload-success-icon upload-result-icon"
        />
      );
    }

    unsavedIcon = (
      <a
        className={setTabMenuClassNames("2", tabs)}
        data-testid="unsaved-experiences-menu"
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
      data-testid="tabs-menu"
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
      data-testid="upload-all"
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
      data-testid="server-error"
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
  const fields = entry.fields.map(value => {
    const field = value as ExperienceFragment_entries_edges_node_fields;

    return {
      data: field.data,
      defId: field.defId,
    };
  });

  return {
    expId: entry.expId,
    clientId: entry.clientId,
    fields,
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
        fieldDefs: experience.fieldDefs.map(fieldDefToUnsavedData),
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
    [] as CreateEntryInput[],
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
