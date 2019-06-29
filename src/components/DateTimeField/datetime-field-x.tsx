import React, { useState, useRef } from "react";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import DateField from "../DateField";
import { FormObjVal } from "../Experience/utils";
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  getFieldName,
  LABELS,
  Props,
} from "./datetime-field";

export function DateTimeField(props: Props) {
  const { className, name: compName, setValue, value } = props;
  const [datetime, setDatetime] = useState(value);

  function setDateVal(a: string, date: FormObjVal) {
    const date1 = date as Date;
    setDateTimeVal({}, date1);
  }

  function setDateTimeVal(
    { h = datetime.getHours(), m = datetime.getMinutes() },
    date = datetime,
  ) {
    date.setHours(h);
    date.setMinutes(m);
    setDatetime(date);
    setValue(compName, date);
  }

  const fieldNames = useRef(
    (function getFieldNames() {
      return LABELS.reduce(
        function reduceLabels(acc, l) {
          acc[l] = getFieldName(compName, l);
          return acc;
        },
        { date: "", hr: "", min: "" },
      );
    })(),
  ).current;

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
            fluid={true}
            selection={true}
            compact={true}
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
            fluid={true}
            selection={true}
            compact={true}
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
