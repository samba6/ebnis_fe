import React, { useEffect, Dispatch, useRef, useReducer } from "react";
import {
  Formik,
  FastField,
  FormikProps,
  FieldProps,
  FieldArray,
  ArrayHelpers,
  FormikErrors,
  Field
} from "formik";
import {
  Form,
  Button,
  Icon,
  Input,
  Message,
  TextArea,
  Dropdown
} from "semantic-ui-react";
import { ApolloError } from "apollo-client";
import { NavigateFn } from "@reach/router";

import "./styles.scss";
import {
  Props,
  ValidationSchema,
  FIELD_TYPES,
  EMPTY_FIELD,
  reducer,
  State,
  Action_Types,
  Action,
  GraphQlErrorState,
  GraphQlError
} from "./utils";
import { CreateExpMutation_exp } from "../../graphql/apollo-types/CreateExpMutation";
import {
  CreateExp as FormValues,
  CreateFieldDef
} from "../../graphql/apollo-types/globalTypes";
import { makeExperienceRoute } from "../../constants/experience-route";
import { noop, setDocumentTitle, makeSiteTitle } from "../../constants";
import { EXPERIENCE_DEFINITION_TITLE } from "../../constants/experience-definition-title";
import { ExperienceDefinitionUpdate } from "./update";
import { CreateExpMutationFn } from "../../graphql/create-exp.mutation";
import { scrollTop } from "./scrollTop";
import { SidebarHeader } from "../SidebarHeader";

export function ExperienceDefinition(props: Props) {
  const { createExp, navigate } = props;
  const [state, dispatch] = useReducer(reducer, {
    showDescriptionInput: true
  } as State);

  const routeRef = useRef<HTMLDivElement | null>(null);

  useEffect(function setCompTitle() {
    setDocumentTitle(makeSiteTitle(EXPERIENCE_DEFINITION_TITLE));

    return setDocumentTitle;
  }, []);

  function FieldDef(
    values: FormValues,
    arrayHelpers: ArrayHelpers,
    field: CreateFieldDef,
    index: number
  ) {
    const { submittedFormErrors, graphQlError } = state;

    const errorClass =
      getFieldContainerErrorClassFromForm(index, submittedFormErrors) ||
      (graphQlError &&
        graphQlError.fieldDefs &&
        graphQlError.fieldDefs[index] &&
        "errors") ||
      "";

    return (
      <div
        data-testid={`field-def-container-${index + 1}`}
        key={index}
        className={`${errorClass} field-def-container`}
      >
        <FastField
          name={makeFieldName(index, "name")}
          index={index}
          component={FieldNameComponent}
          dispatch={dispatch}
          submittedFormErrors={submittedFormErrors}
          graphQlError={graphQlError}
        />

        <FastField
          index={index}
          name={makeFieldName(index, "type")}
          submittedFormErrors={submittedFormErrors}
          component={FieldDataTypeComponent}
        />

        <FieldBtnCtrlsComponent
          index={index}
          values={values}
          arrayHelpers={arrayHelpers}
          dispatch={dispatch}
        />
      </div>
    );
  }

  const renderFieldDefs = (values: FormValues) => (
    arrayHelpers: ArrayHelpers
  ) => {
    return (
      <>
        {values.fieldDefs.map((field, index) =>
          FieldDef(values, arrayHelpers, field as CreateFieldDef, index)
        )}
      </>
    );
  };

  function onSubmit(formikProps: FormikProps<FormValues>) {
    return async function() {
      dispatch({
        type: Action_Types.CLEAR_ALL_ERRORS
      });

      const { validateForm, setSubmitting, values } = formikProps;
      setSubmitting(true);

      const errors = await validateForm(values);

      if (errors.title || errors.fieldDefs) {
        dispatch({
          type: Action_Types.SET_FORM_ERROR,
          payload: errors
        });

        setSubmitting(false);
        return;
      }

      try {
        const result = await (createExp as CreateExpMutationFn)({
          variables: {
            exp: values
          },

          update: ExperienceDefinitionUpdate
        });

        const exp = (result &&
          result.data &&
          result.data.exp) as CreateExpMutation_exp;

        (navigate as NavigateFn)(makeExperienceRoute(exp.id));
      } catch (error) {
        dispatch({
          type: Action_Types.SET_GRAPHQL_ERROR,
          payload: parseGraphQlError(error)
        });

        scrollTop(routeRef);
      }

      setSubmitting(false);
    };
  }

  function renderForm(formikProps: FormikProps<FormValues>) {
    const { dirty, isSubmitting, values } = formikProps;
    const { title, fieldDefs } = values;
    const formInvalid = !(!!title && !!fieldDefs.length);

    return (
      <Form onSubmit={onSubmit(formikProps)}>
        <GraphQlErrorsSummaryComponent
          graphQlError={state.graphQlError}
          dispatch={dispatch}
        />

        <FastField
          name="title"
          graphQlError={state.graphQlError}
          component={TitleInputComponent}
        />

        <Field
          name="description"
          dispatch={dispatch}
          showDescriptionInput={state.showDescriptionInput}
          component={DescriptionInputComponent}
        />

        <FieldArray name="fieldDefs" render={renderFieldDefs(values)} />

        <Button
          className="submit-btn"
          id="experience-def-submit-btn"
          name="experience-def-submit-btn"
          color="green"
          inverted={true}
          disabled={!dirty || formInvalid || isSubmitting}
          loading={isSubmitting}
          type="submit"
          fluid={true}
        >
          <Icon name="checkmark" /> Submit
        </Button>
      </Form>
    );
  }

  const render = (
    <div className="components-experience-definition">
      <SidebarHeader title="[New] Experience Definition" sidebar={true} />

      <div className="main" ref={routeRef}>
        <Formik<FormValues>
          initialValues={{
            title: "",
            description: "",
            fieldDefs: [{ ...EMPTY_FIELD }]
          }}
          onSubmit={noop}
          render={renderForm}
          validationSchema={ValidationSchema}
          validateOnChange={false}
        />
      </div>
    </div>
  );

  return render;
}

function FieldNameComponent({
  field,
  index,
  dispatch,
  submittedFormErrors,
  graphQlError
}: FieldProps<FormValues> & {
  index: number;
  dispatch: Dispatch<Action>;
  submittedFormErrors: FormikErrors<FormValues>;
  graphQlError: GraphQlErrorState;
}) {
  const { name, value, ...rest } = field;

  const error =
    getFieldError(name, "name", submittedFormErrors) ||
    (graphQlError && graphQlError[name]) ||
    "";

  return (
    <Form.Field error={!!error}>
      <label htmlFor={name}>{`Field ${index + 1} Name`}</label>

      <Input {...rest} value={value} autoComplete="off" name={name} id={name} />

      <FormCtrlError error={error} index1={index + 1} />
    </Form.Field>
  );
}

function FieldDataTypeComponent({
  field: { name, value },
  form: { setFieldValue },
  submittedFormErrors,
  index
}: FieldProps<FormValues> & {
  submittedFormErrors: FormikErrors<FormValues>;
  index: number;
}) {
  const error = getFieldError(name, "type", submittedFormErrors);

  return (
    <Form.Field error={!!error}>
      <label htmlFor={name}>{`Field ${index + 1} Data Type`}</label>

      <Dropdown
        fluid={true}
        selection={true}
        value={value}
        compact={true}
        name={name}
        options={FIELD_TYPES}
        onChange={function fieldTypeChanged(evt, data) {
          const val = data.value as string;

          setFieldValue(name, val);
        }}
      />

      <FormCtrlError error={error} index1={index + 1} />
    </Form.Field>
  );
}

/**
 * SUMMARY OF RULES FOR FIELD CTRL BUTTONS
 * 1. If only one field and the field is empty, no button is shown
 * 2. If only one field and the field is filled, add button only is shown
 * 3. Any field that is not completely filled does not get the add button
 *    *completely* means filling field name and selecting a data type
 * 4. The first field never gets an up button
 * 5. The last field never gets a down button
 */
function FieldBtnCtrlsComponent({
  index,
  values,
  arrayHelpers,
  dispatch
}: {
  index: number;
  values: FormValues;
  arrayHelpers: ArrayHelpers;
  dispatch: Dispatch<Action>;
}) {
  const fieldDefs = values.fieldDefs as CreateFieldDef[];
  const field = fieldDefs[index];
  const len = fieldDefs.length;
  const isCompletelyFilled = field.name && field.type;

  if (len === 1 && !isCompletelyFilled) {
    return null;
  }

  const showUp = index > 0;
  const showDown = len - index !== 1;
  const index1 = index + 1;

  return (
    <div data-testid={`field-controls-${index1}`} className="field-controls">
      <Button.Group className="control-buttons" basic={true} compact={true}>
        {isCompletelyFilled && (
          <Button
            data-testid={`add-field-btn-${index1}`}
            type="button"
            onClick={function onFieldAddClicked() {
              arrayHelpers.insert(index1, { ...EMPTY_FIELD });

              dispatch({
                type: Action_Types.CLEAR_ALL_ERRORS,
                payload: undefined
              });
            }}
          >
            <Icon name="plus" />
          </Button>
        )}

        {len > 1 && (
          <Button
            data-testid={`remove-field-btn-${index1}`}
            type="button"
            onClick={function onFieldDeleteClicked() {
              arrayHelpers.remove(index);

              dispatch({
                type: Action_Types.CLEAR_ALL_ERRORS,
                payload: undefined
              });
            }}
          >
            <Icon name="minus" />
          </Button>
        )}

        {showUp && (
          <Button
            data-testid={`go-up-field-btn-${index1}`}
            type="button"
            onClick={function onFieldUpClicked() {
              const indexUp = index;
              const indexDown = index - 1;
              arrayHelpers.swap(indexUp, indexDown);
            }}
          >
            <Icon name="arrow up" />
          </Button>
        )}

        {showDown && (
          <Button
            data-testid={`go-down-field-btn-${index1}`}
            type="button"
            onClick={function onFieldDownClicked() {
              arrayHelpers.swap(index, index1);
            }}
          >
            <Icon name="arrow down" />
          </Button>
        )}
      </Button.Group>
    </div>
  );
}

function DescriptionInputComponent({
  field,
  showDescriptionInput,
  dispatch
}: FieldProps<FormValues> & {
  showDescriptionInput: boolean;
  dispatch: Dispatch<Action>;
}) {
  return (
    <Form.Field>
      <label
        data-testid="description-field-toggle"
        className="description-field-toggle"
        htmlFor={field.name}
        onClick={() =>
          dispatch({
            type: Action_Types.SET_SHOW_DESCRIPTION_INPUT,
            payload: !showDescriptionInput
          })
        }
      >
        Description
        {showDescriptionInput ? (
          <Icon name="caret down" data-testid="description-visible-icon" />
        ) : (
          <Icon name="caret left" data-testid="description-not-visible-icon" />
        )}
      </label>

      {showDescriptionInput && <TextArea {...field} id={field.name} />}
    </Form.Field>
  );
}

function TitleInputComponent({
  field,
  graphQlError
}: FieldProps<FormValues> & {
  graphQlError: GraphQlErrorState | undefined;
}) {
  const error = (graphQlError && graphQlError.title) || "";

  return (
    <Form.Field error={!!error}>
      <label htmlFor={field.name}>Title</label>

      <Input {...field} autoComplete="off" id={field.name} />

      <FormCtrlError error={error} index1={0} />
    </Form.Field>
  );
}

function parseGraphQlError({ graphQLErrors }: ApolloError) {
  const transformedError = {} as GraphQlErrorState;

  for (const err of graphQLErrors) {
    /**
     * example of err.message JSON string:
     * {
     *  "field_defs":[
     *    {"name":"aaaaaaaaaaaa---1 has already been taken"},
     *    {"name":"aaaaaaaaaaaa---2 has already been taken"}
     *  ],
     *  "title": "too short"
     * }
     */
    const { field_defs, title } = JSON.parse(err.message) as GraphQlError;

    // istanbul ignore next: this is trivial. The complexity is with field_defs
    if (title) {
      transformedError.title = title;
    }

    // istanbul ignore next: this is trivial also - no need to set up test
    if (!field_defs) {
      continue;
    }

    for (const { name } of field_defs) {
      const fieldNameError = parseGraphQlErrorFieldName(name);

      // istanbul ignore next: we trust server to give us expected JSON string
      if (!fieldNameError) {
        continue;
      }

      const [index, nameError] = fieldNameError;
      // we store the errors as formik field name so we can trivially access
      // the errors at places where we have formik field name
      transformedError[makeFieldName(index, "name")] = nameError;

      // we also store the field index and corresponding error so we can easily
      // access error with field index (no transformation required)
      const fieldDefs = transformedError.fieldDefs || {};
      fieldDefs[index] = `name ${nameError}`;
      transformedError.fieldDefs = fieldDefs;
    }
  }

  /**
   * At the end of the day, transformedError looks like this:
   * {
   *    title: "title related error",
   *    "fieldDefs[0].name": "field definition 0 name error",
   *    "fieldDefs[1].name": "field definition 1 name error",
   *    fieldDefs: {
   *      "1": "field definition 0 name error",
   *      "2": "field definition 1 name error",
   *    }
   * }
   *
   * we store the formik path names
   * (fieldDefs[0].name, fieldDefs[1].name, fieldDefs[index].name)
   * on the upper level so we can easily access
   * them from render without transforming the error.
   * An earlier attempt
   * required calling functions to transform the data into forms that can
   * be used - this is no longer required because all shapes in which the
   * data can be consumed (formik field names and indices)
   * are now stored on this object. This potentially
   * makes this object large and convenient but I'm not sure if it is better
   * than the previous approach of calling functions to tranform errors
   */

  return transformedError;
}

/**
 * The server will return field definition errors in the form
 * {\"name\":\"aaaaaaaaaaaa---2 has already been taken\"}
 * we are interested in the number following --- (2 in this case) which
 * represents the 1-based index of the field and the texts following the
 * number which represent the error associated with that field
 */
const graphQLErrorsRegExp = /---(\d+)\s*(.+)/;

function parseGraphQlErrorFieldName(val?: string): [number, string] | null {
  // istanbul ignore next: trivial
  if (!val) {
    return null;
  }

  const exec = graphQLErrorsRegExp.exec(val);

  // istanbul ignore next: trust the server to return the correct string
  if (!exec) {
    return null;
  }

  return [Number(exec[1]), exec[2]];
}

function GraphQlErrorsSummaryComponent({
  graphQlError,
  dispatch
}: {
  graphQlError: GraphQlErrorState | undefined;
  dispatch: Dispatch<Action>;
}) {
  if (!graphQlError) {
    return null;
  }

  const { fieldDefs, title } = graphQlError;

  return (
    <Message
      data-testid="graphql-errors-summary"
      style={{ display: "block" }}
      error={true}
      onDismiss={() =>
        dispatch({
          type: Action_Types.SET_GRAPHQL_ERROR,
          payload: undefined
        })
      }
    >
      <Message.Header className="graphql-errors-header">
        Error in submitted form!
      </Message.Header>

      <Message.Content>
        {title && <div>Title {title}</div>}

        <GraphQlErrorFieldDefsComponent fieldDefs={fieldDefs} />
      </Message.Content>
    </Message>
  );
}

function GraphQlErrorFieldDefsComponent({
  fieldDefs
}: {
  fieldDefs?: { [k: string]: string };
}) {
  // istanbul ignore next: trivial
  if (!fieldDefs) {
    return null;
  }

  return (
    <>
      {Object.entries(fieldDefs).map(([index, error]) => (
        <div key={index} className="graphql-field-defs-error-inner">
          <span>Field {Number(index) + 1}</span>
          <span>{error}</span>
        </div>
      ))}
    </>
  );
}

function makeFieldName(index: number, key: keyof CreateFieldDef) {
  return `fieldDefs[${index}].${key}`;
}

function getFieldContainerErrorClassFromForm(
  index: number,
  submittedFormErrors: FormikErrors<FormValues> | undefined
) {
  if (!submittedFormErrors) {
    return "";
  }

  const fieldDefs = submittedFormErrors.fieldDefs as string[];

  if (fieldDefs[index]) {
    return "errors";
  }
  return "";
}

function getFieldError(
  formikName: string,
  fieldName: keyof CreateFieldDef,
  submittedFormErrors: FormikErrors<FormValues> | undefined
) {
  if (!submittedFormErrors) {
    return null;
  }

  const fieldDefs = submittedFormErrors.fieldDefs as string[];

  // tslint:disable-next-line:prefer-for-of
  for (let i = 0; i < fieldDefs.length; i++) {
    const field = (fieldDefs[i] || {}) as CreateFieldDef;
    const val = field[fieldName] || "";

    if (val.startsWith(formikName)) {
      return val.replace(formikName, "");
    }
  }

  return null;
}

function FormCtrlError({
  error,
  index1
}: {
  error: null | string;
  index1: number;
}) {
  return error ? (
    <div
      className="form-control-error"
      data-testid={`form-control-error-${index1}`}
    >
      {error}
    </div>
  ) : null;
}
