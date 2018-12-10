import React, {
  useEffect,
  useState,
  Fragment,
  SetStateAction,
  Dispatch,
  useRef,
  useContext
} from "react";
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

import "./new-exp.scss";
import { Props, ValidationSchema, FIELD_TYPES } from "./new-exp";
import Header from "../../components/Header";
import { setTitle } from "../../Routing";
import {
  CreateExp as FormValues,
  CreateFieldDef,
  FieldType
} from "../../graphql/apollo-gql.d";
import { ApolloError } from "apollo-client";
import { makeExpRoute } from "../../Routing";
import EXPS_QUERY, { GetExpGqlProps } from "../../graphql/exps.query";
import { AppContext } from "../../containers/AppContext/app-context";

const EMPTY_FIELD = { name: "", type: "" as FieldType };

interface SelectFieldTypeState {
  [k: number]: string | null;
}

export const NewExperience = (props: Props) => {
  const { setHeader } = useContext(AppContext);
  const { createExp, history } = props;
  const [selectValues, setSelectValues] = useState({} as SelectFieldTypeState);
  const routeRef = useRef<HTMLDivElement | null>(null);
  const [showDescriptionInput, setShowDescriptionInput] = useState(true);

  const [graphQlError, setGraphQlError] = useState<
    GraphQlErrorState | undefined
  >(undefined);

  const [submittedFormErrors, setSubmittedFormErrors] = useState<
    undefined | FormikErrors<FormValues>
  >(undefined);

  useEffect(function setCompTitle() {
    setHeader(<Header title="New Experience" sideBar={true} />);
    setTitle("New Experience");

    return setTitle;
  }, []);

  const renderField = (values: FormValues, arrayHelpers: ArrayHelpers) => (
    field: CreateFieldDef | null,
    index: number
  ) => {
    if (!field) {
      return null;
    }

    const errorClass =
      getFieldContainerErrorClassFromForm(index, submittedFormErrors) ||
      (graphQlError &&
        graphQlError.fieldDefs &&
        graphQlError.fieldDefs[index] &&
        "errors") ||
      "";

    return (
      <div key={index} className={`${errorClass} field-defs-container`}>
        {renderFieldBtnCtrl(index, values, arrayHelpers)}

        <FastField
          name={makeFieldName(index, "name")}
          render={renderFieldName}
        />

        <FastField
          name={makeFieldName(index, "type")}
          render={renderFieldDataType(index)}
        />
      </div>
    );
  };

  const renderFieldDataType = (index: number) => (
    formProps: FieldProps<FormValues>
  ) => {
    const {
      field: { name, value },
      form: { setFieldValue }
    } = formProps;

    const error = getFieldError(name, "type", submittedFormErrors);

    return (
      <Form.Field error={!!error}>
        <label htmlFor={name}>Field Data Type</label>

        <Dropdown
          fluid
          selection
          value={value}
          compact={true}
          name={name}
          options={FIELD_TYPES}
          onChange={function fieldTypeChanged(_evt, data) {
            const val = data.value as string;

            setFieldValue(name, val);

            setSelectValues({
              ...selectValues,
              [index]: val
            });
          }}
          onFocus={() => setSubmittedFormErrors(undefined)}
        />

        {renderFormCtrlError(error)}
      </Form.Field>
    );
  };

  function renderFieldName(formProps: FieldProps<FormValues>) {
    const {
      field: { name, value, ...rest }
    } = formProps;

    const error =
      getFieldError(name, "name", submittedFormErrors) ||
      (graphQlError && graphQlError[name]) ||
      "";

    return (
      <Form.Field error={!!error}>
        <label htmlFor={name}>Field Name</label>

        <Input
          {...rest}
          value={value}
          autoComplete="off"
          name={name}
          id={name}
          onFocus={() => setSubmittedFormErrors(undefined)}
        />

        {renderFormCtrlError(error)}
      </Form.Field>
    );
  }

  function renderFieldBtnCtrl(
    index: number,
    values: FormValues,
    arrayHelpers: ArrayHelpers
  ) {
    const fieldDefs = (values.fieldDefs && values.fieldDefs) || [];

    const len = fieldDefs.length;
    const showUp = index > 0;
    const showDown = len - index !== 1;

    return (
      <div className="field-controls">
        <Button.Group className="control-buttons" basic={true} compact={true}>
          <Button
            type="button"
            onClick={function onFieldAddClicked() {
              setSubmittedFormErrors(undefined);
              arrayHelpers.insert(index + 1, { ...EMPTY_FIELD });
            }}
          >
            <Icon name="plus" />
          </Button>

          {len > 1 && (
            <Button
              type="button"
              onClick={function onFieldDeleteClicked() {
                setSelectValues(removeSelectedField(index, fieldDefs));
                arrayHelpers.remove(index);
                setSubmittedFormErrors(undefined);
              }}
            >
              <Icon name="minus" />
            </Button>
          )}

          {showUp && (
            <Button
              type="button"
              onClick={function onFieldUpClicked() {
                const indexUp = index;
                const indexDown = index - 1;
                arrayHelpers.swap(indexUp, indexDown);
                setSelectValues(
                  swapSelectField(fieldDefs, indexUp, indexDown, selectValues)
                );
              }}
            >
              <Icon name="arrow up" />
            </Button>
          )}

          {showDown && (
            <Button
              type="button"
              onClick={function onFieldDownClicked() {
                arrayHelpers.swap(index, index + 1);
                setSelectValues(
                  swapSelectField(fieldDefs, index, index + 1, selectValues)
                );
              }}
            >
              <Icon name="arrow down" />
            </Button>
          )}
        </Button.Group>
      </div>
    );
  }

  const renderFieldDefs = (values: FormValues) => (
    arrayHelpers: ArrayHelpers
  ) => {
    return (
      <Fragment>
        {values.fieldDefs.map(renderField(values, arrayHelpers))}
      </Fragment>
    );
  };

  function renderTitleInput(formProps: FieldProps<FormValues>) {
    const { field } = formProps;
    const error = (graphQlError && graphQlError.title) || "";

    return (
      <Form.Field error={!!error}>
        <label htmlFor={field.name}>Title</label>

        <Input {...field} autoFocus={true} autoComplete="off" id={field.name} />

        {renderFormCtrlError(error)}
      </Form.Field>
    );
  }

  function renderDescriptionInput(formProps: FieldProps<FormValues>) {
    const { field } = formProps;

    return (
      <Form.Field>
        <label
          className="description-field-label"
          htmlFor={field.name}
          onClick={() => setShowDescriptionInput(!showDescriptionInput)}
        >
          Description
          {!showDescriptionInput && <Icon name="caret left" />}
          {showDescriptionInput && <Icon name="caret down" />}
        </label>

        {showDescriptionInput && <TextArea {...field} id={field.name} />}
      </Form.Field>
    );
  }

  function submit(formikProps: FormikProps<FormValues>) {
    return async function submitInner() {
      setSubmittedFormErrors(undefined);
      setGraphQlError(undefined);

      const { values, validateForm, setSubmitting } = formikProps;
      setSubmitting(true);

      const errors = await validateForm(values);

      if (errors.title || errors.fieldDefs) {
        setSubmittedFormErrors(errors);
        setSubmitting(false);
        return;
      }

      if (!createExp) {
        return;
      }

      try {
        const result = await createExp({
          variables: {
            exp: values
          },

          update: async function(client, { data: newExperience }) {
            if (!newExperience) {
              return;
            }

            const { exp } = newExperience;

            if (!exp) {
              return;
            }

            const data = client.readQuery<GetExpGqlProps>({
              query: EXPS_QUERY
            });

            if (!data) {
              return;
            }

            const { exps } = data;

            if (!exps) {
              return;
            }

            await client.writeQuery({
              query: EXPS_QUERY,
              data: { exps: [...exps, exp] }
            });
          }
        });

        if (result) {
          const { data } = result;

          if (data) {
            const { exp } = data;

            if (exp) {
              history.replace(makeExpRoute(exp.id));
            }
          }
        }
      } catch (error) {
        setGraphQlError(parseGraphQlError(error));
        const { current } = routeRef;

        if (current) {
          current.scrollTop = 0;
        }
      }

      setSubmitting(false);
    };
  }

  function renderForm(formikProps: FormikProps<FormValues>) {
    const { dirty, isSubmitting, values } = formikProps;
    const { title, fieldDefs } = values;
    const hasTitle = !!title;
    const hasFieldDefs = !!fieldDefs.length;
    const formInvalid = !(hasTitle && hasFieldDefs);

    return (
      <Form onSubmit={submit(formikProps)}>
        {renderGraphQlError(graphQlError, setGraphQlError)}

        <FastField name="title" render={renderTitleInput} />

        <Field name="description" render={renderDescriptionInput} />

        <FieldArray name="fieldDefs" render={renderFieldDefs(values)} />

        {hasFieldDefs ? <hr className="submit-btn-hr" /> : undefined}

        <Button
          className="new-exp-submit"
          id="new-exp-submit"
          name="new-exp-submit"
          color="green"
          inverted={true}
          disabled={!dirty || formInvalid || isSubmitting}
          loading={isSubmitting}
          type="submit"
          fluid={true}
        >
          <Icon name="checkmark" /> Ok
        </Button>
      </Form>
    );
  }

  const render = (
    <div className="app-main routes-exp-def" ref={routeRef}>
      <Formik<FormValues>
        initialValues={{
          title: "",
          description: "",
          fieldDefs: [{ ...EMPTY_FIELD }]
        }}
        onSubmit={nullSubmit}
        render={renderForm}
        validationSchema={ValidationSchema}
        validateOnChange={false}
      />
    </div>
  );

  return render;
};

export default NewExperience;

// ------------------------HELPER FUNCTIONS----------------------------

interface GraphQlError {
  field_defs?: { name?: string; type?: string }[];
  title?: string;
}

type GraphQlErrorState = { [k: string]: string } & {
  fieldDefs?: {
    [k: number]: string;
  };
};

function parseGraphQlError(error: ApolloError) {
  const transformedError = {} as GraphQlErrorState;

  for (const err of error.graphQLErrors) {
    const { field_defs, title } = JSON.parse(err.message) as GraphQlError;

    if (title) {
      transformedError["title"] = title;
    }

    if (!field_defs) {
      continue;
    }

    for (const { name } of field_defs) {
      const fieldNameError = parseGraphQlErrorFieldName(name);

      if (fieldNameError) {
        const [index, nameError] = fieldNameError;
        transformedError[makeFieldName(index, "name")] = nameError;

        // we also store the field index and corresponding error so we can easily
        // access error with field index (no transformation required)
        const fieldDefs = transformedError.fieldDefs || {};
        fieldDefs[index] = "name" + " " + nameError;
        transformedError.fieldDefs = fieldDefs;
      }
    }

    // we store the formik path names on the upper level so we can easily access
    // them from render without transforming the error (an earlier attempt)
    // required calling functions to transform the data into forms that can
    // be used - this is no longer required because all shapes in which the
    // data can be consumed are now stored on this object.  This potentially
    // makes this object large and convinent but I'm not sure if it is better
    // than the previous approach)
  }

  return transformedError;
}

function parseGraphQlErrorFieldName(val?: string): [number, string] | null {
  if (!val) {
    return null;
  }

  const exec = /---(\d+)\s*(.+)/.exec(val);

  if (!exec) {
    return null;
  }

  return [Number(exec[1]), exec[2]];
}

function renderGraphQlError(
  graphQlError: GraphQlErrorState | undefined,
  setGraphQlError: Dispatch<SetStateAction<GraphQlErrorState | undefined>>
) {
  if (!graphQlError) {
    return null;
  }

  const { fieldDefs, title } = graphQlError;

  return (
    <Message
      style={{ display: "block" }}
      error={true}
      onDismiss={() => setGraphQlError(undefined)}
    >
      <Message.Header className="graphql-errors-header">
        Error in submitted form!
      </Message.Header>

      {title && <div>Title {title}</div>}

      <Message.Content>
        {renderGraphQlErrorFieldDefs(fieldDefs)}
      </Message.Content>
    </Message>
  );
}

function renderGraphQlErrorFieldDefs(fieldDefs?: { [k: string]: string }) {
  if (!fieldDefs) {
    return null;
  }

  return (
    <Fragment>
      <div className="graphql-field-defs-error-container">Fields</div>

      {Object.entries(fieldDefs).map(([index, error]) => (
        <div key={index} className="graphql-field-defs-error-inner">
          <span>{Number(index) + 1}</span>
          <span>{error}</span>
        </div>
      ))}
    </Fragment>
  );
}

function swapSelectField(
  fieldDefs: (CreateFieldDef | null)[],
  indexA: number,
  indexB: number,
  selectedValues: SelectFieldTypeState
) {
  const values = {} as SelectFieldTypeState;
  const fieldA = fieldDefs[indexA];
  const fieldB = fieldDefs[indexB];

  if (fieldA && fieldA.type) {
    values[indexB] = fieldA.type;
  } else {
    values[indexB] = null;
  }

  if (fieldB && fieldB.type) {
    values[indexA] = fieldB.type;
  } else {
    values[indexA] = null;
  }

  const newSelectedVals = {
    ...selectedValues,
    ...values
  };

  return newSelectedVals;
}

function removeSelectedField(
  removedIndex: number,
  fieldDefs: (null | CreateFieldDef)[]
) {
  const selected = {} as SelectFieldTypeState;
  const len = fieldDefs.length - 1;

  for (let i = removedIndex; i < len; i++) {
    const nextIndex = i + 1;
    const field = fieldDefs[nextIndex];

    if (!field) {
      continue;
    }

    selected[i] = field.type;
  }

  return selected;
}

function makeFieldName(index: number, key: keyof CreateFieldDef) {
  return `fieldDefs[${index}]${key}`;
}

function nullSubmit() {
  return null;
}

function getFieldContainerErrorClassFromForm(
  index: number,
  submittedFormErrors: FormikErrors<FormValues> | undefined
) {
  if (!submittedFormErrors) {
    return "";
  }

  const { fieldDefs } = submittedFormErrors;

  if (!fieldDefs) {
    return "";
  }

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

  const { fieldDefs } = submittedFormErrors;

  if (!(fieldDefs && fieldDefs.length)) {
    return null;
  }

  for (let i = 0; i < fieldDefs.length; i++) {
    const field = (fieldDefs[i] || {}) as CreateFieldDef;
    const val = field[fieldName] || "";

    if (val.startsWith(formikName)) {
      return val.replace(formikName, "");
    }
  }

  return null;
}

function renderFormCtrlError(error: null | string) {
  return error && <div className="form-control-error">{error}</div>;
}
