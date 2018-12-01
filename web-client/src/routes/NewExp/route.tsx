import React, { useEffect, useState } from "react";
import {
  Formik,
  FastField,
  FormikProps,
  FieldProps,
  FieldArray,
  ArrayHelpers
} from "formik";
// import { Field } from "formik";
import { Form, Button, Icon, Input } from "semantic-ui-react";
// import lodashIsEmpty from "lodash/isEmpty";

import "./new-exp.scss";
import { Props, ValidationSchema, fieldTypes } from "./new-exp";
import Header from "../../components/Header";
import { setTitle } from "../../Routing";
import {
  CreateExperience as FormValues,
  CreateExpField
} from "../../graphql/apollo-gql.d";
import Select from "react-select";

interface SelectValues {
  [k: number]: null | { value: string };
}

export const NewExp = (props: Props) => {
  const { setHeader } = props;
  const [selectValues, setSelectValues] = useState({} as SelectValues);

  useEffect(() => {
    if (setHeader) {
      setHeader(<Header title="New Experience" sideBar={true} />);
    }

    setTitle("New");

    return setTitle;
  }, []);

  const makeFieldName = (index: number, key: keyof CreateExpField) =>
    `fields.${index}.${key}`;

  const renderField = (values: FormValues, arrayHelpers: ArrayHelpers) => (
    field: CreateExpField | null,
    index: number
  ) => {
    if (!field) {
      return undefined;
    }

    return (
      <div key={index} className="field-container">
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
      field: { value, name, ...rest },
      form: { setFieldValue }
    } = formProps;

    return (
      <Form.Field>
        <Select
          {...rest}
          name={name}
          options={fieldTypes}
          value={selectValues[index]}
          getOptionLabel={({ value }) => value}
          getOptionValue={({ value }) => value}
          onChange={data => {
            data = data as { value: string } | null;

            setFieldValue(name, (data && data.value) || "");

            setSelectValues({
              ...selectValues,
              [index]: data
            });
          }}
        />
      </Form.Field>
    );
  };

  const renderFieldName = (formProps: FieldProps<FormValues>) => {
    const {
      field: { name, ...rest }
    } = formProps;

    return (
      <Form.Field>
        <label htmlFor={name}>Field Name</label>

        <Input
          {...rest}
          placeholder="Field Name"
          autoComplete="off"
          name={name}
          id={name}
        />
      </Form.Field>
    );
  };

  const renderFieldBtnCtrl = (
    index: number,
    values: FormValues,
    arrayHelpers: ArrayHelpers
  ) => {
    const fields = (values.fields && values.fields) || [];

    const swapSelectField = (a: number, b: number) => {
      setSelectValues({
        ...selectValues,
        [a]: {
          value: (fields[b] || { type: "" }).type
        },
        [b]: {
          value: (fields[a] || { type: "" }).type
        }
      });
    };

    const removeSelectedField = (index: number) => {
      const selected = Object.entries(selectValues).reduce(
        (acc, [k, v]) => {
          const k1 = Number(k);
          if (k1 < index) {
            acc[k1] = v;
          } else if (k1 > index) {
            acc[k1 - 1] = v;
          }

          return acc;
        },
        {} as SelectValues
      );

      setSelectValues(selected);
    };

    const len = fields.length;
    const showUp = index > 0;
    const showDown = len - index !== 1;

    return (
      <div className="field-controls">
        <Button.Group className="control-buttons" basic={true} compact={true}>
          <Button onClick={() => arrayHelpers.insert(index + 1, { name: "" })}>
            <Icon name="plus" />
          </Button>

          <Button
            onClick={() => {
              arrayHelpers.remove(index);
              removeSelectedField(index);
            }}
          >
            <Icon name="minus" />
          </Button>

          {showUp && (
            <Button
              onClick={() => {
                const indexUp = index;
                const indexDown = index - 1;
                arrayHelpers.swap(indexUp, indexDown);
                swapSelectField(indexUp, indexDown);
              }}
            >
              <Icon name="arrow up" />
            </Button>
          )}

          {showDown && (
            <Button
              onClick={() => {
                arrayHelpers.swap(index, index + 1);
                swapSelectField(index, index + 1);
              }}
            >
              <Icon name="arrow down" />
            </Button>
          )}
        </Button.Group>
      </div>
    );
  };

  const renderFields = (values: FormValues) => (arrayHelpers: ArrayHelpers) => {
    if (values.fields && values.fields.length) {
      return <div>{values.fields.map(renderField(values, arrayHelpers))}</div>;
    }

    const { title } = values;

    if (title && title.length > 1) {
      return (
        <Button
          id="add-field-button"
          name="add-field-button"
          color="green"
          inverted={true}
          onClick={() => arrayHelpers.push({ name: "", type: "" })}
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

  const submit = (formikProps: FormikProps<FormValues>) => async () => {
    const { values, validateForm, setSubmitting } = formikProps;
    setSubmitting(true);

    const errors = await validateForm(values);

    // tslint:disable-next-line:no-console
    console.log(
      `


    logging starts


    errors`,
      errors,
      `

    logging ends


    `
    );

    if (errors.title || errors.fields) {
      return;
    }

    // tslint:disable-next-line:no-console
    console.log(
      `


    logging starts


    values`,
      values,
      `

    logging ends


    `
    );
  };

  function renderForm(formikProps: FormikProps<FormValues>) {
    const { dirty, isSubmitting, values } = formikProps;

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
          disabled={!dirty || isSubmitting}
          loading={isSubmitting}
          type="submit"
          fluid={true}
        >
          <Icon name="checkmark" /> Ok
        </Button>
      </Form>
    );
  }

  return (
    <div className="app-main routes-new-exp">
      <Formik<FormValues>
        initialValues={{ title: "", fields: [] }}
        onSubmit={() => null}
        render={renderForm}
        validationSchema={ValidationSchema}
        validateOnChange={false}
      />
    </div>
  );
};

export default NewExp;
