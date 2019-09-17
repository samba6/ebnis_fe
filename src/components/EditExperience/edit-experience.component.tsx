import React, { useMemo, useState } from "react";
import { Formik, Field, FormikProps, FieldProps } from "formik";
import { noop } from "../../constants";
import {
  EditExperienceActionType,
  Props,
  EditingState,
  UpdateErrors,
} from "./edit-experience.utils";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Modal from "semantic-ui-react/dist/commonjs/modules/Modal";
import TextArea from "semantic-ui-react/dist/commonjs/addons/TextArea";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { UpdateExperienceInput } from "../../graphql/apollo-types/globalTypes";
import immer from "immer";
import { ApolloError } from "apollo-client";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import "./edit-experience.styles.scss";

const unwantedExperienceFields: (keyof ExperienceFragment)[] = [
  "__typename",
  "entries",
  "insertedAt",
  "updatedAt",
  "clientId",
  "dataDefinitions",
  "hasUnsaved",
];

export function EditExperience(props: Props) {
  const { experience, dispatch, onEdit } = props;

  const [editingState, setState] = useState<EditingState>([
    EditExperienceActionType.ready,
  ]);

  const [stateTag, stateData] = editingState;

  const initialFormValues = useMemo(() => {
    return immer(experience, proxy => {
      proxy.description = proxy.description || "";
      // proxy.id = "1";

      unwantedExperienceFields.forEach(f => {
        delete proxy[f];
      });
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(formikProps: FormikProps<UpdateExperienceInput>) {
    return async function onSubmitInner() {
      setState([EditExperienceActionType.submitting]);

      const { values } = formikProps;

      try {
        const result = await onEdit({
          variables: {
            input: values,
          },
        });

        const updatedData =
          result && result.data && result.data.updateExperience;

        if (!updatedData) {
          setState([
            EditExperienceActionType.genericServerError,
            "Something went wrong - please try again.",
          ]);
          return;
        }

        const { experience, errors } = updatedData;

        if (experience) {
          dispatch([EditExperienceActionType.completed]);

          return;
        }

        if (errors) {
          setState([
            EditExperienceActionType.experienceError,
            { experienceError: errors },
          ]);
        }
      } catch (error) {
        const serverError = error as ApolloError;

        setState([
          EditExperienceActionType.genericServerError,
          serverError.message,
        ]);
      }
    };
  }

  function renderForm(formikProps: FormikProps<UpdateExperienceInput>) {
    const { dirty } = formikProps;

    const { titleError } = parseErrors(editingState);

    return (
      <Form onSubmit={onSubmit(formikProps)}>
        <Form.Field error={!!titleError}>
          <label htmlFor="edit-experience-form-title">Title</label>

          <Field
            name="title"
            render={({ field }: FieldProps<UpdateExperienceInput>) => {
              return (
                <Input
                  error={!!titleError}
                  id="edit-experience-form-title"
                  {...field}
                />
              );
            }}
          />

          {titleError && (
            <FormCtrlError
              id="edit-experience-ctrl-error-title"
              error={titleError}
            />
          )}
        </Form.Field>

        <Form.Field>
          <label htmlFor="edit-experience-form-description">Description</label>

          <Field
            name="description"
            render={({ field }: FieldProps<UpdateExperienceInput>) => {
              return (
                <TextArea id="edit-experience-form-description" {...field} />
              );
            }}
          />
        </Form.Field>

        <Button
          className="edit-experience-submit"
          id="edit-experience-submit"
          color="green"
          inverted={true}
          disabled={!dirty || stateTag === EditExperienceActionType.submitting}
          loading={stateTag === EditExperienceActionType.submitting}
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
      id="edit-experience-modal"
      open={true}
      closeIcon={true}
      onClose={() => {
        dispatch([EditExperienceActionType.aborted]);
      }}
      dimmer="inverted"
    >
      <Modal.Header>Edit Experience</Modal.Header>

      {stateTag === EditExperienceActionType.genericServerError && (
        <Modal.Content>
          <Message
            id="edit-experience-server-error"
            error={true}
            onDismiss={() => {
              setState([EditExperienceActionType.ready]);
            }}
          >
            <Message.Content style={{ paddingTop: "15px" }}>
              {stateData}
            </Message.Content>
          </Message>
        </Modal.Content>
      )}

      <Modal.Content>
        <Formik<UpdateExperienceInput>
          onSubmit={noop}
          render={renderForm}
          validateOnChange={false}
          initialValues={initialFormValues}
        />
      </Modal.Content>
    </Modal>
  );
}

export default EditExperience;

function parseErrors([stateTag, stateData]: EditingState) {
  const errorObject: {
    titleError?: string | null;
    dataDefinitionsErrors: { [k: string]: string };
  } = {
    dataDefinitionsErrors: {},
  };

  if (stateTag !== EditExperienceActionType.experienceError) {
    return errorObject;
  }

  const { experienceError } = stateData as UpdateErrors;

  if (experienceError) {
    const { title } = experienceError;

    errorObject.titleError = title;
  }

  return errorObject;
}
