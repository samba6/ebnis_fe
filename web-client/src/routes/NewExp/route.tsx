import React, { useEffect, useState } from "react";
import {
  Formik,
  FastField,
  FormikProps,
  FieldProps,
  FieldArray,
  ArrayHelpers,
  FormikErrors
} from "formik";
// import { Field } from "formik";
import { Form, Button, Icon, Input } from "semantic-ui-react";

import "./new-exp.scss";
import { Props, ValidationSchema, fieldTypes, SelectValue } from "./new-exp";
import Header from "../../components/Header";
import { setTitle } from "../../Routing";
import {
  CreateExperience as FormValues,
  CreateExpField
} from "../../graphql/apollo-gql.d";
import Select from "react-select";

type SelectFieldTypeStateVal = null | SelectValue;
type SelectFieldTypeState = {
  [k: number]: SelectFieldTypeStateVal;
};

export const NewExp = (props: Props) => {
  const { setHeader, createExperience } = props;
  const [selectValues, setSelectValues] = useState({} as SelectFieldTypeState);
  const [submittedFormErrors, setSubmittedFormErrors] = useState<
    undefined | FormikErrors<FormValues>
  >(undefined);

  useEffect(() => {
    if (setHeader) {
      setHeader(<Header title="New Experience" sideBar={true} />);
    }

    setTitle("New");

    return setTitle;
  }, []);

  const makeFieldName = (index: number, key: keyof CreateExpField) =>
    `fields[${index}].${key}`;

  function getFieldContainerErrorClass(index: number) {
    if (!submittedFormErrors) {
      return "";
    }

    const { fields } = submittedFormErrors;

    if (!fields) {
      return "";
    }

    if (fields[index]) {
      return "errors";
    }
    return "";
  }

  const renderField = (values: FormValues, arrayHelpers: ArrayHelpers) => (
    field: CreateExpField | null,
    index: number
  ) => {
    if (!field) {
      return null;
    }

    return (
      <div
        key={index}
        className={` ${getFieldContainerErrorClass(index)} fields-container`}
      >
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
      field: { name, ...rest },
      form: { setFieldValue }
    } = formProps;

    const error = getFieldError(name, "type");

    return (
      <Form.Field error={!!error}>
        <Select
          {...rest}
          name={name}
          options={fieldTypes}
          value={selectValues[index]}
          getOptionLabel={({ value }) => {
            return value;
          }}
          getOptionValue={({ value }) => {
            return value;
          }}
          onChange={data => {
            const data1 = data as SelectFieldTypeStateVal;

            setFieldValue(name, (data1 && data1.value) || "");

            setSelectValues({
              ...selectValues,
              [index]: data1
            });
          }}
          onFocus={() => setSubmittedFormErrors(undefined)}
        />

        {renderFormCtrlError(error)}
      </Form.Field>
    );
  };

  function getFieldError(formikName: string, fieldName: keyof CreateExpField) {
    if (!submittedFormErrors) {
      return null;
    }

    const { fields } = submittedFormErrors;

    if (!(fields && fields.length)) {
      return null;
    }

    for (let i = 0; i < fields.length; i++) {
      const field = (fields[i] || {}) as CreateExpField;
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

  const renderFieldName = (formProps: FieldProps<FormValues>) => {
    const {
      field: { name, ...rest }
    } = formProps;

    const error = getFieldError(name, "name");

    return (
      <Form.Field error={!!error}>
        <label htmlFor={name}>Field Name</label>

        <Input
          {...rest}
          placeholder="Field Name"
          autoComplete="off"
          name={name}
          id={name}
          onFocus={() => setSubmittedFormErrors(undefined)}
        />

        {renderFormCtrlError(error)}
      </Form.Field>
    );
  };

  function swapSelectField(
    fields: (CreateExpField | null)[],
    a: number,
    b: number
  ) {
    const values = {} as SelectFieldTypeState;
    const fieldA = fields[a];
    const fieldB = fields[b];

    if (fieldA && fieldA.type) {
      values[b] = { value: fieldA.type } as SelectFieldTypeStateVal;
    } else {
      values[b] = null;
    }

    if (fieldB && fieldB.type) {
      values[a] = { value: fieldB.type } as SelectFieldTypeStateVal;
    } else {
      values[a] = null;
    }

    setSelectValues({
      ...selectValues,
      ...values
    });
  }

  function removeSelectedField(
    removedIndex: number,
    fields: (null | CreateExpField)[]
  ) {
    const selected = {} as SelectFieldTypeState;
    const len = fields.length - 1;

    for (let i = removedIndex; i < len; i++) {
      const nextIndex = i + 1;

      const field = fields[nextIndex];

      if (!field) {
        continue;
      }

      selected[i] = { value: field.type || "" };
    }

    setSelectValues(selected);
  }

  const renderFieldBtnCtrl = (
    index: number,
    values: FormValues,
    arrayHelpers: ArrayHelpers
  ) => {
    const fields = (values.fields && values.fields) || [];

    const len = fields.length;
    const showUp = index > 0;
    const showDown = len - index !== 1;

    return (
      <div className="field-controls">
        <Button.Group className="control-buttons" basic={true} compact={true}>
          <Button
            type="button"
            onClick={() => {
              setSubmittedFormErrors(undefined);
              arrayHelpers.insert(index + 1, { name: "" });
            }}
          >
            <Icon name="plus" />
          </Button>

          <Button
            type="button"
            onClick={() => {
              removeSelectedField(index, fields);
              arrayHelpers.remove(index);
              setSubmittedFormErrors(undefined);
            }}
          >
            <Icon name="minus" />
          </Button>

          {showUp && (
            <Button
              type="button"
              onClick={() => {
                const indexUp = index;
                const indexDown = index - 1;
                arrayHelpers.swap(indexUp, indexDown);
                swapSelectField(fields, indexUp, indexDown);
              }}
            >
              <Icon name="arrow up" />
            </Button>
          )}

          {showDown && (
            <Button
              type="button"
              onClick={() => {
                arrayHelpers.swap(index, index + 1);
                swapSelectField(fields, index, index + 1);
              }}
            >
              <Icon name="arrow down" />
            </Button>
          )}
        </Button.Group>
      </div>
    );
  };

  function addEmptyFields(arrayHelpers: ArrayHelpers) {
    return function onAddEmptyFields() {
      arrayHelpers.push({ name: "", type: "" });
    };
  }

  const renderFields = (values: FormValues) => (arrayHelpers: ArrayHelpers) => {
    if (values.fields && values.fields.length) {
      return <div>{values.fields.map(renderField(values, arrayHelpers))}</div>;
    }

    const { title } = values;

    if (title && title.length > 1) {
      return (
        <Button
          type="button"
          id="add-field-button"
          name="add-field-button"
          color="green"
          inverted={true}
          onClick={addEmptyFields(arrayHelpers)}
        >
          <Icon name="plus" /> Add field
        </Button>
      );
    }

    return null;
  };

  function renderTitleInput(formProps: FieldProps<FormValues>) {
    const { field } = formProps;

    return (
      <Form.Field
        {...field}
        control={Input}
        placeholder="Title"
        autoComplete="off"
        label="Title"
        id="title"
        autoFocus={true}
      />
    );
  }

  function submit(formikProps: FormikProps<FormValues>) {
    return async function submitInner() {
      setSubmittedFormErrors(undefined);

      const { values, validateForm, setSubmitting } = formikProps;
      setSubmitting(true);

      const errors = await validateForm(values);

      if (errors.title || errors.fields) {
        setSubmittedFormErrors(errors);
        setSubmitting(false);
        return;
      }

      if (createExperience) {
        const result = await createExperience({
          variables: {
            experience: values
          }
        });

        // tslint:disable-next-line:no-console
        console.log(
          `


        logging starts


        const result = await createExperience({
              label`,
          result,
          `

        logging ends


        `
        );
      }

      setSubmitting(false);
    };
  }

  function renderForm(formikProps: FormikProps<FormValues>) {
    const { dirty, isSubmitting, values } = formikProps;

    const { title, fields } = values;
    let formInvalid = false;

    if (!title) {
      formInvalid = true;
    }

    if (!(fields && fields.length)) {
      formInvalid = true;
    }

    return (
      <Form onSubmit={submit(formikProps)}>
        <FastField name="title" render={renderTitleInput} />

        <FieldArray name="fields" render={renderFields(values)} />

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

  function nullSubmit() {
    return null;
  }

  return (
    <div className="app-main routes-new-exp">
      <Formik<FormValues>
        initialValues={{ title: "", fields: [] }}
        onSubmit={nullSubmit}
        render={renderForm}
        validationSchema={ValidationSchema}
        validateOnChange={false}
      />
    </div>
  );
};

export default NewExp;
