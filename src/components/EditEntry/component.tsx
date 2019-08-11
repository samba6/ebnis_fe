import React, { useMemo } from "react";
import { Props, FormValues, DefinitionFormValue } from "./utils";
import { Formik, FormikProps, FieldArray, Field } from "formik";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";

export function EditEntry(props: Props) {
  const { entry, definitions } = props;

  const initialDefinitionsValues = useMemo(() => {
    return definitions.map(definition => {
      return {
        name: definition.name,
        type: definition.type,
      };
    });
  }, []);

  function renderForm(formProps: FormikProps<{}>) {
    return (
      <Form>
        <DefinitionsComponent formProps={formProps} />
      </Form>
    );
  }

  return (
    <Formik
      render={renderForm}
      initialValues={{
        definitions: initialDefinitionsValues,
      }}
    />
  );
}

interface DefinitionsComponentProps {
  formProps: FormikProps<FormValues>;
}

function DefinitionsComponent(props: DefinitionsComponentProps) {
  const {
    formProps: {
      values: { definitions },
    },
  } = props;

  return (
    <FieldArray
      name="definitions"
      render={() => {
        return definitions.map(definition => {
          return (
            <Field
              key={definition.name}
              render={() => {
                return <DefinitionComponent definition={definition} />;
              }}
            />
          );
        });
      }}
    />
  );
}

interface DefinitionComponentProps {
  definition: DefinitionFormValue;
}

function DefinitionComponent(props: Props) {
  const { definition } = props;
  const { id } = definition;
  const idPrefix = `definition-${id}`;

  return (
    <div id={idPrefix}>
      <Form.Field id={`${idPrefix}-name`}>{definition.name}</Form.Field>
    </div>
  );
}
