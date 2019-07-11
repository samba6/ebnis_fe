import React, { useMemo, useState, useEffect } from "react";
import { Props, EditEntryStateTag, State, ServerFieldsErrors } from "./utils";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import { Formik, FormikProps, Field, FieldProps, FieldArray } from "formik";
import "./styles.scss";
import { EntryFragment } from "../../graphql/apollo-types/EntryFragment";
import {
  CreateField,
  UpdateEntryInput,
  FieldType,
} from "../../graphql/apollo-types/globalTypes";
import { noop } from "../../constants";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import DateField from "../DateField";
import dateFnFormat from "date-fns/format";
import DateTimeField from "../DateTimeField";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import TextArea from "semantic-ui-react/dist/commonjs/addons/TextArea";
import { scrollIntoView } from "../scroll-into-view";
import {
  UpdateEntryMutation_updateEntry,
  UpdateEntryMutation_updateEntry_fieldsErrors,
  UpdateEntryMutation_updateEntry_fieldsErrors_error,
} from "../../graphql/apollo-types/UpdateEntryMutation";
import { FormCtrlError } from "../FormCtrlError/component";

const unwantedEntryFields: (keyof EntryFragment)[] = [
  "clientId",
  "expId",
  "__typename",
  "insertedAt",
  "updatedAt",
];

export function EditEntry(props: Props) {
  const { dispatch, experienceTitle, entry, fieldDefinitions, onEdit } = props;

  const [[stateTag, stateData], setState] = useState<State>([
    EditEntryStateTag.initial,
  ]);

  const [initialFormValues, fieldDefinitionsMap] = useMemo(() => {
    const value = { ...entry } as UpdateEntryInput;

    unwantedEntryFields.forEach(u => {
      delete value[u];
    });

    const fields = value.fields.map(f => {
      const g = { ...f } as CreateField;
      delete g["__typename"];
      return g;
    });

    value.fields = fields;

    const fieldDefinitionsMap = fieldDefinitions.reduce(
      (acc, { id, type, name }) => {
        acc[id] = {
          type,
          typeLower: type.toLowerCase(),
          entryFieldName: name,
        };
        return acc;
      },
      {} as {
        [k: string]: {
          type: string;
          typeLower: string;
          entryFieldName: string;
        };
      },
    );

    return [value, fieldDefinitionsMap];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stateTag === EditEntryStateTag.serverOtherErrors) {
      scrollIntoView("edit-entry-server-error-scroll-into-view", {
        behavior: "smooth",
      });

      return;
    }

    if (stateTag === EditEntryStateTag.serverFieldErrors) {
      const [id] = Object.keys(stateData as ServerFieldsErrors);
      const { entryFieldName } = fieldDefinitionsMap[id];

      scrollIntoView(`${entryFieldName}-error`, {
        behavior: "smooth",
      });

      return;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateTag]);

  function onsubmit(formProps: FormikProps<UpdateEntryInput>) {
    return async function onSubmitInner() {
      setState([EditEntryStateTag.submitting]);

      const { values } = formProps;

      try {
        const result = await onEdit({
          variables: {
            input: values,
          },
        });

        const { entry: updatedEntry, fieldsErrors } = ((result &&
          result.data &&
          result.data.updateEntry) ||
          {}) as UpdateEntryMutation_updateEntry;

        if (fieldsErrors) {
          const errors = (fieldsErrors as UpdateEntryMutation_updateEntry_fieldsErrors[]).reduce(
            (acc, item) => {
              acc[
                item.defId
              ] = item.error as UpdateEntryMutation_updateEntry_fieldsErrors_error;
              return acc;
            },
            {} as ServerFieldsErrors,
          );

          setState([EditEntryStateTag.serverFieldErrors, errors]);

          return;
        }

        if (!updatedEntry) {
          setState([EditEntryStateTag.serverOtherErrors, "Unknown error"]);

          return;
        }

        dispatch([EditEntryStateTag.completed]);
      } catch (errors) {
        setState([EditEntryStateTag.serverOtherErrors, errors.message]);
      }
    };
  }

  function renderForm(formProps: FormikProps<UpdateEntryInput>) {
    const { values, dirty } = formProps;

    return (
      <Form onSubmit={onsubmit(formProps)}>
        <FieldArray name="fields">
          {() => {
            return values.fields.map((entryField, entryFieldIndex) => {
              const { defId, data } = entryField as CreateField;

              const { type, entryFieldName, typeLower } = fieldDefinitionsMap[
                defId
              ];

              let errors = {};

              if (stateTag === EditEntryStateTag.serverFieldErrors) {
                errors = stateData as ServerFieldsErrors;
              }

              const error = errors[defId];
              const hasError = !!error;

              return (
                <Form.Field key={entryFieldName} error={hasError}>
                  <label
                    htmlFor={entryFieldName}
                  >{`[${type}] ${entryFieldName}`}</label>

                  <Field name={`fields[${entryFieldIndex}].data`}>
                    {({ field, form }: FieldProps<UpdateEntryInput>) => {
                      const dataValue = JSON.parse(data)[typeLower];
                      const { name: fieldName } = field;

                      switch (type) {
                        case FieldType.DATE: {
                          return (
                            <DateField
                              value={new Date(dataValue)}
                              name={fieldName}
                              setValue={(_, dateValue) => {
                                const stringValue = dateFnFormat(
                                  dateValue,
                                  "YYYY-MM-DD",
                                );

                                form.setFieldValue(
                                  fieldName,
                                  `{"${typeLower}":"${stringValue}"}`,
                                );
                              }}
                            />
                          );
                        }

                        case FieldType.DATETIME: {
                          return (
                            <DateTimeField
                              value={new Date(dataValue)}
                              name={fieldName}
                              setValue={(_, dateValue) => {
                                const stringValue = (dateValue as Date).toJSON();

                                form.setFieldValue(
                                  fieldName,
                                  `{"${typeLower}":"${stringValue}"}`,
                                );
                              }}
                            />
                          );
                        }

                        case FieldType.SINGLE_LINE_TEXT: {
                          return (
                            <Input
                              value={dataValue}
                              error={hasError}
                              id={entryFieldName}
                              name={fieldName}
                              onChange={(_, { value }) => {
                                form.setFieldValue(
                                  fieldName,
                                  `{"${typeLower}":"${value}"}`,
                                );
                              }}
                            />
                          );
                        }

                        case FieldType.MULTI_LINE_TEXT: {
                          return (
                            <TextArea
                              value={dataValue}
                              id={entryFieldName}
                              name={fieldName}
                              onChange={(_, { value }) => {
                                form.setFieldValue(
                                  fieldName,
                                  `{"${typeLower}":"${value}"}`,
                                );
                              }}
                            />
                          );
                        }

                        case FieldType.DECIMAL:
                        case FieldType.INTEGER: {
                          return (
                            <Input
                              value={dataValue}
                              type="number"
                              error={hasError}
                              id={entryFieldName}
                              name={fieldName}
                              onChange={(_, { value }) => {
                                form.setFieldValue(
                                  fieldName,
                                  `{"${typeLower}":"${value}"}`,
                                );
                              }}
                            />
                          );
                        }

                        default: {
                          return (
                            <span id="unknown-data-type">
                              Unknown data type!
                            </span>
                          );
                        }
                      }
                    }}
                  </Field>

                  {error && (
                    <FormCtrlError
                      id={`${entryFieldName}-error`}
                      error={
                        error.data ? `data ${error.data}` : `id ${error.defId}`
                      }
                    />
                  )}
                </Form.Field>
              );
            });
          }}
        </FieldArray>

        <Button
          className="edit-entry-submit"
          id="edit-entry-submit"
          color="green"
          inverted={true}
          disabled={!dirty || stateTag === EditEntryStateTag.submitting}
          loading={stateTag === EditEntryStateTag.submitting}
          type="submit"
          fluid={true}
        >
          <Icon name="checkmark" /> Submit
        </Button>
      </Form>
    );
  }

  return (
    <Modal
      id="edit-entry-modal"
      open={true}
      closeIcon={true}
      onClose={() => {
        dispatch([EditEntryStateTag.aborted]);
      }}
      dimmer="inverted"
      centered={false}
    >
      <Modal.Header>
        Edit Entry
        <div className="edit-entry-title">{experienceTitle}</div>
      </Modal.Header>

      {stateTag === EditEntryStateTag.serverOtherErrors && (
        <Modal.Content className="edit-entry-server-error-container">
          <span
            id="edit-entry-server-error-scroll-into-view"
            className="edit-entry-server-error-scroll-into-view"
          />

          <Message
            id="edit-entry-server-error"
            error={true}
            onDismiss={() => {
              setState([EditEntryStateTag.initial]);
            }}
          >
            <Message.Content style={{ paddingTop: "15px" }}>
              {stateData}
            </Message.Content>
          </Message>
        </Modal.Content>
      )}

      <Modal.Content>
        <Formik<UpdateEntryInput>
          onSubmit={noop}
          initialValues={initialFormValues}
          validateOnChange={false}
          render={renderForm}
        />
      </Modal.Content>
    </Modal>
  );
}
