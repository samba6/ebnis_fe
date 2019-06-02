import React, { useEffect } from "react";
import { Button } from "semantic-ui-react";
import { Link } from "gatsby";

import "./styles.scss";
import { Props, displayFieldType } from "./utils";
import { makeNewEntryRoute } from "../../routes";
import Loading from "../Loading";
import {
  GetExpAllEntries_expEntries,
  GetExpAllEntries_expEntries_fields
} from "../../graphql/apollo-types/GetExpAllEntries";
import {
  GetAnExp_exp_fieldDefs,
  GetAnExp_exp
} from "../../graphql/apollo-types/GetAnExp";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { NavigateFn } from "@reach/router";

export function Experience(props: Props) {
  const {
    getExperienceGql: {
      exp,
      loading: loadingExperience,
      error: getExperienceError
    },
    experienceEntries: { expEntries, loading: experienceEntriesLoading },
    navigate
  } = props;
  const title = exp ? exp.title : "Experience";

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

  function renderEntryField(field: GetExpAllEntries_expEntries_fields) {
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
      <div key={defId}>
        {fieldName} {text}
      </div>
    );
  }

  function renderEntries() {
    if ((expEntries as GetExpAllEntries_expEntries[]).length === 0) {
      return (
        <Link
          className="no-entries"
          to={makeNewEntryRoute((exp as GetAnExp_exp).id)}
        >
          No entries. Click here to add one
        </Link>
      );
    }

    return (
      <>
        {(expEntries as GetExpAllEntries_expEntries[]).map(
          (entry: GetExpAllEntries_expEntries) => {
            return (
              <div key={entry.id} className="entry-container">
                {(entry.fields as GetExpAllEntries_expEntries_fields[]).map(
                  renderEntryField
                )}
              </div>
            );
          }
        )}
      </>
    );
  }

  const render = (
    <div className="components-experience">
      <SidebarHeader title={title} sidebar={true} />

      <div className="main">
        {loadingExperience || experienceEntriesLoading ? (
          <Loading />
        ) : (
          <>
            <div className="header" data-testid="experience-entries">
              <div className="title">{title}</div>

              <div className="new-experience-entry-button">
                <Button
                  type="button"
                  name="new-exp-entry-button"
                  basic={true}
                  compact={true}
                  as={Link}
                  to={makeNewEntryRoute((exp as GetAnExp_exp).id)}
                >
                  New entry
                </Button>
              </div>
            </div>

            {renderEntries()}
          </>
        )}
      </div>
    </div>
  );

  return render;
}
