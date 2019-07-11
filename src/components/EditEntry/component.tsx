import React, { useMemo, useState } from "react";
import { Props, EditEntryStateTag, State } from "./utils";
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
// import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import DateField from "../DateField";
import dateFnFormat from "date-fns/format";
import DateTimeField from "../DateTimeField";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import { ApolloError } from "apollo-client";

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

  function onsubmit(formProps: FormikProps<UpdateEntryInput>) {
    return async function onSubmitInner() {
      setState([EditEntryStateTag.submitting]);

      const { values } = formProps;

      try {
        await onEdit({
          variables: {
            input: values,
          },
        });

        dispatch([EditEntryStateTag.completed]);
      } catch (errors) {
        const { graphQLErrors } = errors as ApolloError;

        const error = graphQLErrors[0].message;

        setState([EditEntryStateTag.serverOtherErrors, error]);
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

              return (
                <Form.Field key={entryFieldName}>
                  <label
                    htmlFor={entryFieldName}
                  >{`[${type}] ${entryFieldName}`}</label>

                  <Field name={`fields[${entryFieldIndex}].data`}>
                    {({
                      field: { name: fieldName },
                      form,
                    }: FieldProps<UpdateEntryInput>) => {
                      const dataValue = JSON.parse(data)[typeLower];

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

                        default: {
                          throw "We should never reach here!";
                        }
                      }
                    }}
                  </Field>
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
        <Modal.Content>
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
