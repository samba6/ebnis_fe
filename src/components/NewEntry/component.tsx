import React, { useEffect, useReducer } from "react";
import { Form, Button } from "semantic-ui-react";
import { NavigateFn } from "@reach/router";

import "./styles.scss";
import {
  Props,
  FormObj,
  FormObjVal,
  ToString,
  pageTitle,
  formFieldNameFromIndex,
  reducer,
  DispatchType,
  Action_Types
} from "./utils";
import { makeExperienceRoute } from "../../constants/experience-route";
import Loading from "../Loading";
import {
  GetAnExp_exp_fieldDefs,
  GetAnExp_exp
} from "../../graphql/apollo-types/GetAnExp";
import { CreateEntryFn } from "../../graphql/create-entry.mutation";
import { update } from "./update";
import { fieldTypeUtils } from "./field-types-utils";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { GetExperienceGqlValues } from "../../graphql/get-exp.query";

export function NewEntry(props: Props) {
  const {
    getExperienceGql: { loading, exp } = {} as GetExperienceGqlValues,
    navigate,
    createEntry
  } = props;

  const [state, dispatch] = useReducer(reducer, { formObj: {} });

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(pageTitle(exp)));

      return setDocumentTitle;
    },
    [exp]
  );

  useEffect(
    function setInitialFormValues() {
      if (exp) {
        dispatch({
          type: Action_Types.experienceToFormValues,
          payload: {
            experience: exp
          }
        });
      }
    },
    [exp]
  );

  function goToExp() {
    (navigate as NavigateFn)(makeExperienceRoute((exp && exp.id) || ""));
  }

  async function onSubmit() {
    const fields = [];
    const { fieldDefs, id: expId } = exp as GetAnExp_exp;

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

    await (createEntry as CreateEntryFn)({
      variables: {
        entry: {
          expId,
          fields
        }
      },

      update: update(expId)
    });

    goToExp();
  }

  function renderMainOr() {
    if (loading) {
      return <Loading />;
    }

    if (!exp) {
      return <Loading />;
    }

    const { fieldDefs, title } = exp;

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
      <SidebarHeader title={pageTitle(exp)} sidebar={true} />

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
