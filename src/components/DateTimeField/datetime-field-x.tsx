import React, { useState, useMemo } from "react";
import { Form, Dropdown } from "semantic-ui-react";

import DateField from "../DateField";
import { FieldComponentProps, FormObjVal } from "../../routes/Exp/exp";
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  getFieldName,
  LABELS
} from "./datetime-field";

interface DateTimeProps extends FieldComponentProps {
  className?: string;
  value: Date;
}

export function DateTimeField(props: DateTimeProps) {
  const { className, name: compName, setValue, value } = props;
  const [datetime, setDatetime] = useState(value);

  function setDateVal(a: string, date: FormObjVal) {
    const date1 = date as Date;
    setDateTimeVal({}, date1);
  }

  function setDateTimeVal(
    { h = datetime.getHours(), m = datetime.getMinutes() },
    date = datetime
  ) {
    date.setHours(h);
    date.setMinutes(m);
    setDatetime(date);
    setValue(compName, date);
  }

  const fieldNames = useMemo(function getFieldNames() {
    return LABELS.reduce(
      function reduceLabels(acc, l) {
        acc[l] = getFieldName(compName, l);
        return acc;
      },
      { date: "", hr: "", min: "" }
    );
  }, []);

  return (
    <Form.Field
      className={`${className || ""} datetime-field`}
      data-testid={`datetime-field-${compName}`}
    >
      <DateField
        name={fieldNames.date}
        value={datetime}
        setValue={setDateVal}
      />

      <div className="datetime-field-time">
        <div className="entry-sub-field_container">
          <label htmlFor="" className="field_label">
            Hour
          </label>
          <Dropdown
            fluid
            selection
            compact
            data-testid={fieldNames.hr}
            name={fieldNames.hr}
            options={HOUR_OPTIONS}
            defaultValue={datetime.getHours()}
            onChange={function dropDownHrChanged(evt, data) {
              setDateTimeVal({ h: data.value as number });
            }}
          />
        </div>

        <div className="entry-sub-field_container">
          <label htmlFor="" className="field_label">
            Minute
          </label>
          <Dropdown
            fluid
            selection
            compact
            data-testid={fieldNames.min}
            name={fieldNames.min}
            options={MINUTE_OPTIONS}
            defaultValue={datetime.getMinutes()}
            onChange={function dropDownMinChanged(evt, data) {
              setDateTimeVal({ m: data.value as number });
            }}
          />
        </div>
      </div>
    </Form.Field>
  );
}

export default DateTimeField;
