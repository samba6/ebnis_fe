import React, { useEffect, Fragment, useMemo } from "react";
import { Button } from "semantic-ui-react";
import dateFnParse from "date-fns/parse";
import dateFnFormat from "date-fns/format";

import "./exp.scss";
import { Props } from "./exp";
import SidebarHeader from "../../components/SidebarHeader";
import { setTitle, makeNewEntryRoute } from "../../Routing";
import Loading from "../../components/Loading";
import {
  GetExpAllEntries_expEntries,
  GetExpAllEntries_expEntries_fields,
  FieldType,
  GetAnExp_exp_fieldDefs
} from "../../graphql/apollo-gql.d";

const displayFieldType = {
  [FieldType.SINGLE_LINE_TEXT](text: string) {
    return text;
  },

  [FieldType.MULTI_LINE_TEXT](text: string) {
    return text;
  },

  [FieldType.DATE](text: string) {
    const date = dateFnParse(text);

    return dateFnFormat(date, "Do MMM, YYYY");
  },

  [FieldType.DATETIME](text: string) {
    const date = dateFnParse(text);

    return dateFnFormat(date, "Do MMM, YYYY hh:mm A");
  },

  [FieldType.DECIMAL](text: string) {
    return Number(text);
  },

  [FieldType.INTEGER](text: string) {
    return Number(text);
  }
};

export const Exp = (props: Props) => {
  const { loading, exp, expEntries, history } = props;

  const fieldDefs = useMemo(
    function computeFieldDefs() {
      return (exp && exp.fieldDefs) || [];
    },
    [exp]
  );

  useEffect(
    function setRouteTitle() {
      setTitle(title);

      return setTitle;
    },
    [exp]
  );

  function goToNewEntry() {
    history.push(makeNewEntryRoute((exp && exp.id) || ""));
  }

  function renderEntryField(field: GetExpAllEntries_expEntries_fields | null) {
    if (!field) {
      return null;
    }

    const { defId, data } = field;
    const fieldDef = fieldDefs.find((f: GetAnExp_exp_fieldDefs | null) =>
      f ? f.id === defId : false
    );

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

  function renderEntry(
    entry: GetExpAllEntries_expEntries | null,
    index: number
  ) {
    if (!entry) {
      return null;
    }

    const { fields } = entry;

    return (
      <div key={index} className="entry-container">
        {fields.map(renderEntryField)}
      </div>
    );
  }

  function renderEntries() {
    if (!(expEntries && expEntries.length)) {
      return (
        <span className="no-entries" onClick={goToNewEntry}>
          No entries. Click here to add one
        </span>
      );
    }

    return <Fragment>{expEntries.map(renderEntry)}</Fragment>;
  }

  if (loading) {
    return <Loading />;
  }

  if (!exp) {
    return <Loading />;
  }

  const { title } = exp;

  const render = (
    <div className="app-container">
      <SidebarHeader title={title} wide={true} sidebar={true} />

      <div className="app-main routes-exp">
        <div className="header">
          <div className="title">{title}</div>

          <Button
            className="new-exp-entry-button"
            type="button"
            name="new-exp-entry-button"
            basic={true}
            compact={true}
            onClick={goToNewEntry}
          >
            New entry
          </Button>
        </div>

        <div className="main">{renderEntries()}</div>
      </div>
    </div>
  );

  return render;
};

export default Exp;
