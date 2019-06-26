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
import { CreateEntryMutationFn } from "../../graphql/create-entry.mutation";
import { updateExperienceWithNewEntry } from "./update";
import { fieldTypeUtils } from "./field-types-utils";
import { SidebarHeader } from "../SidebarHeader";
import { setDocumentTitle, makeSiteTitle } from "../../constants";
import { getConnStatus } from "../../state/get-conn-status";
import { UnsavedExperience } from "../ExperienceDefinition/resolver-utils";
import { ExperienceFragment_fieldDefs } from "../../graphql/apollo-types/ExperienceFragment";

export function NewEntry(props: Props) {
  const {
    navigate,
    createEntry,
    createUnsavedEntry,
    client,
    experience
  } = props;

  const [state, dispatch] = useReducer(reducer, { formObj: {} });

  const pageTitle = makePageTitle(experience);

  useEffect(
    function setRouteTitle() {
      setDocumentTitle(makeSiteTitle(pageTitle));

      return setDocumentTitle;
    },
    [pageTitle]
  );

  useEffect(
    function setInitialFormValues() {
      if (experience) {
        dispatch({
          type: Action_Types.experienceToFormValues,
          payload: {
            experience
          }
        });
      }
    },
    [experience]
  );

  function goToExp() {
    (navigate as NavigateFn)(makeExperienceRoute(experience.id));
  }

  async function onSubmit() {
    const fields = [];
    const { fieldDefs, id: expId } = experience;

    for (const [stringIndex, val] of Object.entries(state.formObj)) {
      const index = Number(stringIndex);
      const field = fieldDefs[index] as ExperienceFragment_fieldDefs;

      const { type, id } = field;
      const toString = fieldTypeUtils[type].toString as ToString;

      fields.push({
        defId: id,
        data: JSON.stringify({ [type.toLowerCase()]: toString(val) })
      });
    }

    if (await getConnStatus(client)) {
      await (createEntry as CreateEntryMutationFn)({
        variables: {
          input: {
            expId,
            fields
          }
        },

        update: updateExperienceWithNewEntry(expId)
      });
    } else {
      await createUnsavedEntry({
        variables: {
          experience: (experience as unknown) as UnsavedExperience,
          fields
        }
      });
    }

    goToExp();
  }

  function renderMainOr() {
    const { fieldDefs, title } = experience;

    return (
      <div className="main">
        <Button type="button" onClick={goToExp} className="title" basic={true}>
          {title}
        </Button>
        <Form onSubmit={onSubmit}>
          {fieldDefs.map((obj, index) => {
            const field = obj as ExperienceFragment_fieldDefs;
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
  field: ExperienceFragment_fieldDefs;
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
