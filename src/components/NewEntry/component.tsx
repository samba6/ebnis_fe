import React, { useEffect, useReducer } from "react";
import { Form, Button } from "semantic-ui-react";
import { NavigateFn } from "@reach/router";

import "./styles.scss";
import {
  Props,
  FormObj,
  FormObjVal,
  ToString,
  makePageTitle,
  formFieldNameFromIndex,
  reducer,
  DispatchType,
  Action_Types
} from "./utils";
import { makeExperienceRoute } from "../../constants/experience-route";
import Loading from "../Loading";
import { GetAnExp_exp_fieldDefs } from "../../graphql/apollo-types/GetAnExp";
import { CreateEntryFn } from "../../graphql/create-entry.mutation";
import { updateExperienceWithNewEntry } from "./update";
import { fieldTypeUtils } from "./field-types-utils";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { GetExperienceGqlValues } from "../../graphql/get-exp.query";
import { getConnStatus } from "../../state/get-conn-status";
import { useManualUnsavedExperience } from "../Experience/use-manual-unsaved-experience";

export function NewEntry(props: Props) {
  const {
    getExperienceGql: { loading } = {} as GetExperienceGqlValues,
    navigate,
    createEntry,
    createUnsavedEntry,
    client
  } = props;

  const {
    experienceToRender,
    loadingUnsavedExperienceForState
  } = useManualUnsavedExperience(props);

  const [state, dispatch] = useReducer(reducer, { formObj: {} });

  const pageTitle = makePageTitle(experienceToRender);

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(pageTitle));

      return setDocumentTitle;
    },
    [pageTitle]
  );

  useEffect(
    function setInitialFormValues() {
      if (experienceToRender) {
        dispatch({
          type: Action_Types.experienceToFormValues,
          payload: {
            experience: experienceToRender
          }
        });
      }
    },
    [experienceToRender]
  );

  function goToExp() {
    (navigate as NavigateFn)(makeExperienceRoute(experienceToRender.id));
  }

  async function onSubmit() {
    const fields = [];
    const { fieldDefs, id: expId } = experienceToRender;

    for (const [stringIndex, val] of Object.entries(state.formObj)) {
      const index = Number(stringIndex);
      const field = fieldDefs[index] as GetAnExp_exp_fieldDefs;

      const { type, id } = field;
      const toString = fieldTypeUtils[type].toString as ToString;

      fields.push({
        defId: id,
        data: JSON.stringify({ [type.toLowerCase()]: toString(val) })
      });
    }

    if (await getConnStatus(client)) {
      await (createEntry as CreateEntryFn)({
        variables: {
          entry: {
            expId,
            fields
          }
        },

        update: updateExperienceWithNewEntry(expId)
      });
    } else {
      await createUnsavedEntry({
        variables: {
          experience: experienceToRender,
          fields
        }
      });
    }

    goToExp();
  }

  function renderMainOr() {
    if ((loading || loadingUnsavedExperienceForState) && !experienceToRender) {
      return <Loading />;
    }

    const { fieldDefs, title } = experienceToRender;

    return (
      <div className="main">
        <Button type="button" onClick={goToExp} className="title" basic={true}>
          {title}
        </Button>
        <Form onSubmit={onSubmit}>
          {fieldDefs.map((obj, index) => {
            const field = obj as GetAnExp_exp_fieldDefs;
            return (
              <FieldComponent
                key={field.id}
                field={field}
                index={index}
                formValues={state.formObj}
                dispatch={dispatch}
              />
            );
          })}

          <Button
            className="submit-btn"
            type="submit"
            inverted={true}
            color="green"
            fluid={true}
          >
            Submit
          </Button>
        </Form>
      </div>
    );
  }

  return (
    <div className="component-new-entry">
      <SidebarHeader title={pageTitle} sidebar={true} />

      {renderMainOr()}
    </div>
  );
}

interface FieldComponentProps {
  field: GetAnExp_exp_fieldDefs;
  index: number;
  formValues: FormObj;
  dispatch: DispatchType;
}

const FieldComponent = React.memo(
  function FieldComponentFn({
    field,
    index,
    dispatch,
    formValues
  }: FieldComponentProps) {
    const { name: fieldTitle, type } = field;
    const formFieldName = formFieldNameFromIndex(index);
    const utils = fieldTypeUtils[type];
    const value = formValues[index] || (utils.default() as FormObjVal);

    return (
      <Form.Field key={index}>
        <label htmlFor={formFieldName}>{fieldTitle + " [" + type + "]"}</label>

        {utils.component({
          formFieldName,
          dispatch,
          value
        })}
      </Form.Field>
    );
  },

  function FieldComponentDiff(prevProps, nextProps) {
    const {
      field: { type: prevType },
      formValues: prevFormValues
    } = prevProps;
    const {
      field: { type: nextType },
      formValues: nextFormValues
    } = nextProps;

    const prevVal =
      prevFormValues[prevProps.index] || fieldTypeUtils[prevType].default;

    const nextVal =
      nextFormValues[nextProps.index] || fieldTypeUtils[nextType].default;

    return prevVal === nextVal;
  }
);
