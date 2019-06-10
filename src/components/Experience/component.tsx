import React, { useEffect, Fragment, useReducer, useRef } from "react";
import { Button } from "semantic-ui-react";
import { Link } from "gatsby";

import "./styles.scss";
import {
  Props,
  displayFieldType,
  reducer,
  defaultState,
  ActionType
} from "./utils";
import { makeNewEntryRoute } from "../../routes";
import Loading from "../Loading";
import {
  GetAnExp_exp_fieldDefs,
  GetAnExp_exp,
  GetAnExp_exp_entries,
  GetAnExp_exp_entries_edges,
  GetAnExp_exp_entries_edges_node,
  GetAnExp_exp_entries_edges_node_fields
} from "../../graphql/apollo-types/GetAnExp";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { NavigateFn } from "@reach/router";
import { GetExperienceGqlValues } from "../../graphql/get-exp.query";
import {
  UnsavedExperienceDataValue,
  GET_UNSAVED_EXPERIENCE_QUERY,
  UnsavedExperienceReturnedValue,
  UnsavedExperienceVariables
} from "./resolvers";
export function Experience(props: Props) {
  const {
    getExperienceGql: {
      exp,
      loading: loadingExperience,
      error: getExperienceError
    } = {} as GetExperienceGqlValues,

    navigate,
    client,
    experienceId,
    unsavedExperienceGql: {
      unsavedExperience,
      loading: loadingUnsavedExperience
    } = {} as UnsavedExperienceDataValue
  } = props;

  const [state, dispatch] = useReducer(reducer, defaultState);

  const {
    unsavedExperienceFromState,
    loadingUnsavedExperienceForState
  } = state;

  const experienceToRender = (exp ||
    unsavedExperience ||
    unsavedExperienceFromState) as GetAnExp_exp;

  const title = getTitle(experienceToRender);

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(title));

      return setDocumentTitle;
    },
    [title]
  );

  useEffect(() => {
    if (getExperienceError) {
      (navigate as NavigateFn)("/404");
    }
  }, [getExperienceError]);

  if (getExperienceError) {
    return null;
  }

  const loadingUnsavedExperienceTimeoutRef = useRef<number | null>(null);

  /**
   * When server is offline and
   * user visits this page directly from browser address bar rather
   * than by navigating from another link, it is possible that the cache
   * will not have been ready so that the `unsavedExperience` query will
   * return undefined even when the unsaved experience is in the cache. So we
   * wait for some time and manually fetch the unsaved experience.
   */
  useEffect(() => {
    const { current: timeout } = loadingUnsavedExperienceTimeoutRef;

    if (
      loadingUnsavedExperience === false &&
      !loadingUnsavedExperienceForState &&
      !unsavedExperience &&
      !unsavedExperienceFromState
    ) {
      dispatch({
        type: ActionType.loadingUnsavedExperience,
        payload: true
      });

      loadingUnsavedExperienceTimeoutRef.current = (setTimeout(async () => {
        const result = await client.query<
          UnsavedExperienceReturnedValue,
          UnsavedExperienceVariables
        >({
          query: GET_UNSAVED_EXPERIENCE_QUERY,
          variables: {
            id: experienceId as string
          }
        });

        dispatch({
          type: ActionType.unsavedExperienceLoaded,
          payload: result && result.data && result.data.unsavedExperience
        });
      }, 200) as unknown) as number;

      return;
    }

    if (timeout !== null && (unsavedExperienceFromState || unsavedExperience)) {
      clearTimeout(timeout);
      loadingUnsavedExperienceTimeoutRef.current = null;
    }
  }, [
    loadingUnsavedExperience,
    unsavedExperience,
    loadingUnsavedExperienceForState,
    unsavedExperienceFromState
  ]);

  function renderEntryField(field: GetAnExp_exp_entries_edges_node_fields) {
    const { defId, data } = field;

    const fieldDefs = (exp as GetAnExp_exp)
      .fieldDefs as GetAnExp_exp_fieldDefs[];

    const fieldDef = fieldDefs.find(
      (aFieldDef: GetAnExp_exp_fieldDefs) => aFieldDef.id === defId
    );

    // istanbul ignore next: impossible state?
    if (!fieldDef) {
      return;
    }

    const { type, name: fieldName } = fieldDef;

    const [fieldData] = Object.values(JSON.parse(data));
    const text = displayFieldType[type](fieldData);

    return (
      <Fragment key={defId}>
        {fieldName} {text}
      </Fragment>
    );
  }

  function renderEntries() {
    const entries = experienceToRender.entries as GetAnExp_exp_entries;
    const edges = entries.edges as GetAnExp_exp_entries_edges[];

    if (edges.length === 0) {
      return (
        <Link
          className="no-entries"
          data-testid="no-entries"
          to={makeNewEntryRoute(experienceToRender.id)}
        >
          No entries. Click here to add one
        </Link>
      );
    }

    return (
      <>
        {edges.map((edge: GetAnExp_exp_entries_edges) => {
          const entry = edge.node as GetAnExp_exp_entries_edges_node;

          return (
            <div
              key={entry.id}
              className="entry-container"
              data-testid="entry-container"
            >
              {(entry.fields as GetAnExp_exp_entries_edges_node_fields[]).map(
                renderEntryField
              )}
            </div>
          );
        })}
      </>
    );
  }

  function renderMain() {
    const loading =
      loadingExperience ||
      loadingUnsavedExperience ||
      loadingUnsavedExperienceForState;

    if (loading && !experienceToRender) {
      return <Loading />;
    }

    if (!experienceToRender) {
      return <h1>Error !!!</h1>;
    }

    return (
      <>
        <div className="header" data-testid="experience-entries">
          <div className="title">{title}</div>

          <div className="new-experience-entry-button">
            <Button
              type="button"
              data-testid="new-exp-entry-button"
              basic={true}
              compact={true}
              as={Link}
              to={makeNewEntryRoute(experienceToRender.id)}
            >
              New entry
            </Button>
          </div>
        </div>

        {renderEntries()}
      </>
    );
  }
  return (
    <div className="components-experience">
      <SidebarHeader title={title} sidebar={true} />

      <div className="main">{renderMain()}</div>
    </div>
  );
}

function getTitle(arg?: { title: string }) {
  return arg ? arg.title : "Experience";
}
