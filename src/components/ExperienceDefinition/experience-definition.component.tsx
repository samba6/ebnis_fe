import React, {
  Dispatch,
  useReducer,
  useContext,
  useLayoutEffect,
} from "react";
import {
  Formik,
  FastField,
  FormikProps,
  FieldProps,
  FieldArray,
  ArrayHelpers,
  FormikErrors,
  Field,
} from "formik";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import Button from "semantic-ui-react/dist/commonjs/elements/Button";
import Icon from "semantic-ui-react/dist/commonjs/elements/Icon";
import Input from "semantic-ui-react/dist/commonjs/elements/Input";
import Message from "semantic-ui-react/dist/commonjs/collections/Message";
import TextArea from "semantic-ui-react/dist/commonjs/addons/TextArea";
import { NavigateFn } from "@reach/router";
import "./experience-definition.styles.scss";
import {
  Props,
  ValidationSchema,
  EMPTY_FIELD,
  reducer,
  State,
  ActionType,
  Action,
  fieldTypeKeys,
  DispatchType,
  ServerDataDefinitionsErrorsMap,
  CallerProps,
} from "./experience-definition.utils";
import {
  CreateExperienceInput as FormValues,
  CreateDataDefinition,
} from "../../graphql/apollo-types/globalTypes";
import { makeExperienceRoute } from "../../constants/experience-route";
import { noop, setDocumentTitle, makeSiteTitle } from "../../constants";
import { EXPERIENCE_DEFINITION_TITLE } from "../../constants/experience-definition-title";
import { SidebarHeader } from "../SidebarHeader/sidebar-header.component";
import { FormCtrlError } from "../FormCtrlError/form-ctrl-error.component";
import { ExperienceFragment } from "../../graphql/apollo-types/ExperienceFragment";
import { isConnected } from "../../state/connections";
import { DropdownItemProps } from "semantic-ui-react";
import {
  CreateExperienceMutation_createExperience,
  CreateExperienceMutation_createExperience_errors,
  CreateExperienceMutation_createExperience_errors_dataDefinitionsErrors_errors,
} from "../../graphql/apollo-types/CreateExperienceMutation";
import makeClassNames from "classnames";
import { scrollIntoView } from "../scroll-into-view";
import { ApolloError } from "apollo-client";
import { EbnisAppContext } from "../../context";
import {
  addResolvers,
  ExperienceDefinitionUpdate,
} from "./experience-definition.injectables";
import { useDeleteCachedQueriesAndMutationsOnUnmount } from "../use-delete-cached-queries-mutations-on-unmount";
import { entriesPaginationVariables } from "../../graphql/get-experience-full.query";
import { useCreateExperienceOnline } from "../../graphql/create-experience.mutation";
import { useCreateExperienceOfflineMutation } from "./experience-definition.resolvers";

const mainComponentId = "components-experience-definition";

export function ExperienceDefinitionComponent(props: Props) {
  const {
    createExperienceOffline,
    client,
    navigate,
    createExperienceOnline,
  } = props;

  const [state, dispatch] = useReducer(reducer, {
    showDescriptionInput: true,
  } as State);

  useLayoutEffect(() => {
    addResolvers(client);
    setDocumentTitle(makeSiteTitle(EXPERIENCE_DEFINITION_TITLE));

    return setDocumentTitle;
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  // we use getExperience( instead of getExperience so that getExperiences does
  // not get deleted
  useDeleteCachedQueriesAndMutationsOnUnmount(
    ["getExperience(", "createExperience"],
    true,
  );

  const DataDefinitionsComponent = (values: FormValues) => (
    arrayHelpers: ArrayHelpers,
  ) => {
    return (
      <>
        {values.dataDefinitions.map((definition, index) => {
          return (
            <DataDefinitionComponent
              key={index}
              arrayHelpers={arrayHelpers}
              index={index}
              definitionsErrorsMap={state.serverDataDefinitionsErrorsMap}
              formErrors={state.submittedFormErrors}
              values={values}
              dispatch={dispatch}
              field={definition as CreateDataDefinition}
            />
          );
        })}
      </>
    );
  };

  function onSubmit(formikProps: FormikProps<FormValues>) {
    return async function() {
      dispatch([ActionType.clearAllErrors]);

      const { validateForm, setSubmitting, values } = formikProps;
      setSubmitting(true);

      const errors = await validateForm(values);

      if (errors.title || errors.dataDefinitions) {
        dispatch([ActionType.setFormError, errors]);

        setSubmitting(false);
        return;
      }

      try {
        let result;
        let experienceId;
        let fieldErrors: CreateExperienceMutation_createExperience_errors | null = null;

        if (isConnected()) {
          result = await createExperienceOnline({
            variables: {
              createExperienceInput: values,
              ...entriesPaginationVariables,
            },

            update: ExperienceDefinitionUpdate,
          });

          const { experience, errors } = ((result &&
            result.data &&
            result.data.createExperience) ||
            {}) as CreateExperienceMutation_createExperience;

          fieldErrors = errors;

          if (experience) {
            experienceId = experience.id;
          }
        } else {
          result = await createExperienceOffline({
            variables: {
              createExperienceInput: values,
              ...entriesPaginationVariables,
            },
          });

          experienceId = ((result &&
            result.data &&
            result.data.createOfflineExperience) as ExperienceFragment).id;
        }

        if (experienceId) {
          (navigate as NavigateFn)(makeExperienceRoute(experienceId));

          return;
        }

        scrollIntoView(mainComponentId);

        if (fieldErrors) {
          dispatch([ActionType.FIELD_ERRORS, fieldErrors]);
          return;
        }

        dispatch([
          ActionType.setApolloError,
          {
            networkError: { message: "Unknown error occurred" },
          } as ApolloError,
        ]);
      } catch (error) {
        scrollIntoView(mainComponentId);

        dispatch([
          ActionType.setApolloError,
          error instanceof ApolloError
            ? error
            : ({ networkError: error } as ApolloError),
        ]);
      }

      setSubmitting(false);
    };
  }

  function renderForm(formikProps: FormikProps<FormValues>) {
    const { dirty, isSubmitting, values } = formikProps;
    const { title, dataDefinitions } = values;
    const formInvalid = dataDefinitions.length === 0 && !title;
    const submittedFormErrors = state.submittedFormErrors || {};

    const {
      graphQlError,
      serverDataDefinitionsErrorsMap,
      serverOtherErrorsMap,
    } = state;

    return (
      <Form onSubmit={onSubmit(formikProps)}>
        <AllErrorsSummaryComponent
          serverDataDefinitionsErrorsMap={serverDataDefinitionsErrorsMap}
          serverOtherErrorsMap={serverOtherErrorsMap}
          graphQlError={graphQlError}
          dispatch={dispatch}
        />

        <Field
          name="title"
          error={
            (serverOtherErrorsMap && serverOtherErrorsMap.title) ||
            submittedFormErrors.title
          }
          component={TitleInputComponent}
        />

        <Field
          name="description"
          dispatch={dispatch}
          showDescriptionInput={state.showDescriptionInput}
          component={DescriptionInputComponent}
        />

        <FieldArray
          name="dataDefinitions"
          render={DataDefinitionsComponent(values)}
        />

        <Button
          className="submit-btn"
          id="experience-definition-submit-btn"
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

  return (
    <div className="components-experience-definition">
      <SidebarHeader title="[New] Experience Definition" sidebar={true} />

      <div className="main" id={mainComponentId}>
        <Formik<FormValues>
          initialValues={{
            title: "",
            description: "",
            dataDefinitions: [{ ...EMPTY_FIELD }],
          }}
          onSubmit={noop}
          render={renderForm}
          validationSchema={ValidationSchema}
          validateOnChange={false}
        />
      </div>
    </div>
  );
}

interface DataDefinitionComponentProps {
  values: FormValues;
  arrayHelpers: ArrayHelpers;
  field: CreateDataDefinition;
  index: number;
  dispatch: DispatchType;
  definitionsErrorsMap: State["serverDataDefinitionsErrorsMap"];
  formErrors: State["submittedFormErrors"];
}

function DataDefinitionComponent({
  values,
  arrayHelpers,
  index,
  definitionsErrorsMap,
  formErrors,
  dispatch,
}: DataDefinitionComponentProps) {
  const formError = getDefinitionErrorFromForm(index, formErrors);

  const serverErrors = definitionsErrorsMap && definitionsErrorsMap[index];

  const formErrorsMap = formError
    ? formError
    : ({} as FormikErrors<CreateDataDefinition>);

  const serverErrorsMap = serverErrors
    ? serverErrors
    : ({} as CreateExperienceMutation_createExperience_errors_dataDefinitionsErrors_errors);

  return (
    <div
      id={`experience-definition-container-${index}`}
      key={index}
      className={makeClassNames({
        "definition-container": true,
        errors: !!(formError || serverErrors),
      })}
    >
      <Field
        name={makeFieldName(index, "name")}
        index={index}
        component={FieldNameComponent}
        dispatch={dispatch}
        error={formErrorsMap.name || serverErrorsMap.name}
      />

      <FastField
        index={index}
        name={makeFieldName(index, "type")}
        // error={formErrorsMap.type}
        component={FieldDataTypeComponent}
      />

      <DefinitionBtnCtrlsComponent
        index={index}
        values={values}
        arrayHelpers={arrayHelpers}
        dispatch={dispatch}
      />
    </div>
  );
}

function FieldNameComponent({
  field,
  index,
  error,
}: FieldProps<FormValues> & {
  index: number;
  dispatch: Dispatch<Action>;
  error?: string;
}) {
  const { name, value, ...rest } = field;

  const idPrefix = `field-name-${index}`;

  return (
    <Form.Field error={!!error}>
      <label htmlFor={idPrefix}>{`Field ${index + 1} Name`}</label>

      <Input
        {...rest}
        value={value}
        autoComplete="off"
        name={name}
        id={idPrefix}
      />

      {error && <FormCtrlError error={error} id={`${idPrefix}-error`} />}
    </Form.Field>
  );
}

const FIELD_TYPES: DropdownItemProps[] = fieldTypeKeys.map(k => ({
  value: k,
  text: k,
  key: k,
  content: <span className={`js-${k}`}>{k}</span>,
}));

function FieldDataTypeComponent({
  field: { name, value },
  form: { setFieldValue },
  index,
}: FieldProps<FormValues> & {
  error?: string;
  index: number;
}) {
  const idPrefix = `experience-data-type-${index}`;

  return (
    <Form.Field>
      <label htmlFor={name}>{`Field ${index + 1} Data Type`}</label>

      <Dropdown
        search={true}
        id={idPrefix}
        fluid={true}
        selection={true}
        value={value}
        compact={true}
        options={FIELD_TYPES}
        onChange={function fieldTypeChanged(_, data) {
          const val = data.value as string;

          setFieldValue(name, val);
        }}
      />
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
function DefinitionBtnCtrlsComponent({
  index,
  values,
  arrayHelpers,
  dispatch,
}: {
  index: number;
  values: FormValues;
  arrayHelpers: ArrayHelpers;
  dispatch: Dispatch<Action>;
}) {
  const dataDefinitions = values.dataDefinitions as CreateDataDefinition[];
  const definition = dataDefinitions[index];
  const len = dataDefinitions.length;
  const isCompletelyFilled = definition.name && definition.type;

  if (len === 1 && !isCompletelyFilled) {
    return null;
  }

  const showUpBtn = index > 0;
  const showDownBtn = len - index !== 1;
  const index1 = index + 1;

  return (
    <div className="field-controls">
      <Button.Group className="control-buttons" basic={true} compact={true}>
        {isCompletelyFilled && (
          <Button
            id={`add-definition-btn-${index}`}
            type="button"
            onClick={function onAddDefinitionClicked() {
              arrayHelpers.insert(index1, { ...EMPTY_FIELD });

              dispatch([ActionType.clearAllErrors]);
            }}
          >
            <Icon name="plus" />
          </Button>
        )}

        {len > 1 && (
          <Button
            id={`remove-definition-btn---${index}`}
            type="button"
            onClick={function onDeleteDefinitionClicked() {
              arrayHelpers.remove(index);

              dispatch([ActionType.clearAllErrors]);
            }}
          >
            <Icon name="minus" />
          </Button>
        )}

        {showUpBtn && (
          <Button
            id={`definition-go-up-btn-${index}`}
            type="button"
            onClick={function onDefinitionGoUpClicked() {
              const indexUp = index;
              const indexDown = index - 1;
              arrayHelpers.swap(indexUp, indexDown);
            }}
          >
            <Icon name="arrow up" />
          </Button>
        )}

        {showDownBtn && (
          <Button
            id={`definition-go-down-btn-${index}`}
            type="button"
            onClick={function onDefinitionDownClicked() {
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
  dispatch,
}: FieldProps<FormValues> & {
  showDescriptionInput: boolean;
  dispatch: Dispatch<Action>;
}) {
  return (
    <Form.Field>
      <label
        id="experience-definition-description-toggle"
        className="description-field-toggle"
        htmlFor={"experience-definition-description-input"}
        onClick={() =>
          dispatch([ActionType.showDescriptionInput, !showDescriptionInput])
        }
      >
        Description
        {showDescriptionInput ? (
          <Icon
            name="caret down"
            id="experience-definition-description-visible-icon"
          />
        ) : (
          <Icon
            name="caret left"
            id="experience-definition-description-not-visible-icon"
          />
        )}
      </label>

      {showDescriptionInput && (
        <TextArea {...field} id={"experience-definition-description-input"} />
      )}
    </Form.Field>
  );
}

function TitleInputComponent({
  field,
  error,
}: FieldProps<FormValues> & {
  error?: string;
}) {
  const id = "experience-definition-title-input";

  return (
    <Form.Field error={!!error}>
      <label htmlFor={id}>Title</label>

      <Input {...field} autoComplete="off" id={id} />

      <FormCtrlError error={error} id="experience-definition-title-error" />
    </Form.Field>
  );
}

function AllErrorsSummaryComponent({
  serverDataDefinitionsErrorsMap,
  serverOtherErrorsMap,
  graphQlError,
  dispatch,
}: Pick<
  State,
  "serverDataDefinitionsErrorsMap" | "serverOtherErrorsMap" | "graphQlError"
> & {
  dispatch: DispatchType;
}) {
  if (
    !(serverDataDefinitionsErrorsMap || serverOtherErrorsMap || graphQlError)
  ) {
    return null;
  }

  const otherErrors = serverOtherErrorsMap
    ? Object.entries(serverOtherErrorsMap).reduce((acc, [k, v]) => {
        if (v) {
          acc.push(
            <div key={k}>
              {k} : {v}
            </div>,
          );
        }

        return acc;
      }, [] as JSX.Element[])
    : null;

  return (
    <Message
      id="experience-definition-errors-summary"
      style={{ display: "block" }}
      error={true}
      onDismiss={() => dispatch([ActionType.clearAllErrors])}
    >
      <Message.Header className="graphql-errors-header">
        Error in submitted form!
      </Message.Header>

      <Message.Content>
        {graphQlError && <span>{graphQlError}</span>}

        {otherErrors}

        {serverDataDefinitionsErrorsMap && (
          <DefinitionsErrorsComponent
            definitionsErrors={serverDataDefinitionsErrorsMap}
          />
        )}
      </Message.Content>
    </Message>
  );
}

function DefinitionsErrorsComponent({
  definitionsErrors,
}: {
  definitionsErrors: ServerDataDefinitionsErrorsMap;
}) {
  return (
    <>
      {Object.entries(definitionsErrors).map(([index, errors]) => {
        return (
          <div key={index} className="graphql-field-defs-error-inner">
            <span>Field {Number(index) + 1}</span>
            {Object.entries(errors).reduce((acc, [k, v]) => {
              if (v) {
                acc.push(<span key={k}>{v}</span>);
              }

              return acc;
            }, [] as JSX.Element[])}
          </div>
        );
      })}
    </>
  );
}

function makeFieldName(index: number, key: keyof CreateDataDefinition) {
  return `dataDefinitions[${index}].${key}`;
}

function getDefinitionErrorFromForm(
  index: number,
  formErrors?: FormikErrors<FormValues> | null,
) {
  if (!(formErrors && formErrors.dataDefinitions)) {
    return null;
  }

  return (formErrors.dataDefinitions as FormikErrors<CreateDataDefinition[]>)[
    index
  ];
}

// istanbul ignore next:
export default (props: CallerProps) => {
  const [createExperienceOnline] = useCreateExperienceOnline();
  const [createExperienceOffline] = useCreateExperienceOfflineMutation();
  const { client } = useContext(EbnisAppContext);

  return (
    <ExperienceDefinitionComponent
      client={client}
      createExperienceOnline={createExperienceOnline}
      createExperienceOffline={createExperienceOffline}
      {...props}
    />
  );
};
