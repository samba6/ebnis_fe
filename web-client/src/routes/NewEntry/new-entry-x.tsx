import React, { useEffect, useState } from "react";
import { Form, Input, Button } from "semantic-ui-react";
import dateFnFormat from "date-fns/format";

import "./new-entry.scss";
import { Props, FieldComponentProps, FormObj, FormObjVal } from "./new-entry";
import Header from "../../components/Header";
import { setTitle, makeExpRoute } from "../../Routing";
import Loading from "../../components/Loading";
import {
  GetAnExp_exp_fieldDefs,
  FieldType,
  GetExpAllEntries,
  GetExpAllEntriesVariables
} from "../../graphql/apollo-gql.d";
import DateField from "../../components/DateField";
import DateTimeField from "../../components/DateTimeField";
import GET_EXP_ENTRIES_QUERY from "../../graphql/exp-entries.query";

const fieldTypeUtils = {
  [FieldType.SINGLE_LINE_TEXT]: {
    component(props: FieldComponentProps) {
      return <Input id={props.name} name={props.name} fluid={true} />;
    },
    default: "",
    toString(text: string) {
      return text;
    }
  },

  [FieldType.MULTI_LINE_TEXT]: {
    component(props: FieldComponentProps) {
      return <Input id={props.name} name={props.name} fluid={true} />;
    },

    default: "",
    toString(text: string) {
      return text;
    }
  },

  [FieldType.DATE]: {
    component(props: FieldComponentProps) {
      return <DateField {...props} className="light-border" />;
    },

    default: new Date(),

    toString(date: Date) {
      return dateFnFormat(date, "YYYY-MM-DD");
    }
  },

  [FieldType.DATETIME]: {
    component(props: FieldComponentProps) {
      return <DateTimeField {...props} className="light-border" />;
    },

    default: new Date(),

    toString(date: Date) {
      return date.toJSON();
    }
  },

  [FieldType.DECIMAL]: {
    component(props: FieldComponentProps) {
      return <Input id={props.name} name={props.name} fluid={true} />;
    },

    default: 0,

    toString(val: number) {
      return val + "";
    }
  },

  [FieldType.INTEGER]: {
    component(props: FieldComponentProps) {
      return <Input id={props.name} name={props.name} fluid={true} />;
    },

    default: 0,

    toString(val: number) {
      return val + "";
    }
  }
};

export const NewEntry = (props: Props) => {
  const { setHeader, loading, exp, history, createEntry } = props;
  const [formValues, setFormValues] = useState<FormObj>({} as FormObj);

  useEffect(
    function setRouteTitle() {
      const title = "New " + ((exp && exp.title) || "entry");

      if (setHeader) {
        setHeader(<Header title={title} sideBar={true} />);
      }

      setTitle(title);

      return setTitle;
    },
    [props.exp]
  );

  useEffect(
    function setInitialFormValues() {
      if (!exp) {
        return;
      }

      const { fieldDefs } = exp;

      if (!(fieldDefs && fieldDefs.length)) {
        return;
      }

      const initialFormValues = fieldDefs.reduce(function fieldDefReducer(
        acc,
        field,
        index
      ) {
        if (!field) {
          return acc;
        }

        acc[index] = fieldTypeUtils[field.type].default;
        return acc;
      },
      {});

      setFormValues(initialFormValues);
    },
    [props.exp]
  );

  function setValue(fieldName: string, value: FormObjVal) {
    const fieldIndex = getIndexFromFieldName(fieldName);

    if (fieldIndex === undefined) {
      return;
    }

    setFormValues({ ...formValues, [fieldIndex]: value });
  }

  function getFieldName(index: number) {
    return `fields[${index}]`;
  }

  function getIndexFromFieldName(fieldName: string) {
    const exec = /fields.+(\d+)/.exec(fieldName);

    if (!exec) {
      return undefined;
    }

    return exec[1];
  }

  function goToExp() {
    history.push(makeExpRoute((exp && exp.id) || ""));
  }

  async function submit() {
    if (!(exp && createEntry)) {
      return;
    }

    const fields = [];
    const { fieldDefs } = exp;

    for (const [index, val] of Object.entries(formValues)) {
      const index1 = Number(index);
      const field = fieldDefs[index1];

      if (!field) {
        continue;
      }

      const { type, id } = field;
      const toString = fieldTypeUtils[type].toString as any;

      fields.push({
        defId: id,
        data: JSON.stringify({ [type.toLowerCase()]: toString(val) })
      });
    }

    const { id: expId } = exp;

    const variables = {
      entry: {
        expId,
        fields
      }
    };

    await createEntry({
      variables,
      update: async function(client, { data: newEntry }) {
        if (!newEntry) {
          return;
        }

        const { entry } = newEntry;

        if (!entry) {
          return;
        }

        const variables = {
          entry: { expId }
        };

        const data = client.readQuery<
          GetExpAllEntries,
          GetExpAllEntriesVariables
        >({
          query: GET_EXP_ENTRIES_QUERY,
          variables
        });

        if (!data) {
          return;
        }

        await client.writeQuery({
          query: GET_EXP_ENTRIES_QUERY,
          variables,
          data: {
            expEntries: [...(data.expEntries || []), entry]
          }
        });
      }
    });

    goToExp();
  }

  if (loading) {
    return <Loading />;
  }

  if (!exp) {
    return <Loading />;
  }

  const { fieldDefs, title } = exp;

  function renderField(field: GetAnExp_exp_fieldDefs | null, index: number) {
    if (!field) {
      return null;
    }

    const { name: fieldName, type } = field;
    const name = getFieldName(index);

    return (
      <Form.Field key={index}>
        <label htmlFor={fieldName}>{fieldName}</label>

        {fieldTypeUtils[type].component({ name, setValue })}
      </Form.Field>
    );
  }

  const render = (
    <div className="app-main routes-new-entry">
      <Button type="button" onClick={goToExp} className="title" basic={true}>
        {title}
      </Button>

      <Form className="main">
        {fieldDefs.map(renderField)}

        <hr />

        <Button
          type="submit"
          inverted={true}
          color="green"
          fluid={true}
          onClick={submit}
        >
          Submit
        </Button>
      </Form>
    </div>
  );

  return render;
};

export default NewEntry;
