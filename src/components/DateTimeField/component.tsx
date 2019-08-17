import React, { useState, useMemo } from "react";
import Dropdown from "semantic-ui-react/dist/commonjs/modules/Dropdown";
import Form from "semantic-ui-react/dist/commonjs/collections/Form";
import { DateField } from "../DateField/component";
import { FormObjVal } from "../Experience/experience.utils";
import { Props } from "./utils";
import "../DateField/date-field.styles.scss";

interface DropdownOptions {
  key: number;
  text: string;
  value: number;
  content?: JSX.Element;
}

export const HOUR_OPTIONS = Array.from<undefined, DropdownOptions>(
  { length: 24 },
  (_, hrIndex) => {
    const text = ("" + hrIndex).padStart(2, "0");

    return {
      key: hrIndex,
      text,
      value: hrIndex,
      content: (
        <span className={`text js-datetime-field-input-hour-${text}`}>
          {text}
        </span>
      ),
    };
  },
);

export const MINUTE_OPTIONS = Array.from<void, DropdownOptions>(
  { length: 60 },
  (_, minIndex) => {
    const text = ("" + minIndex).padStart(2, "0");

    return {
      key: minIndex,
      text,
      value: minIndex,
      content: (
        <span className={`text js-datetime-field-input-minute-${text}`}>
          {text}
        </span>
      ),
    };
  },
);

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

  const fieldNames = useMemo(function getFieldNames() {
    return ["date", "hr", "min"].reduce(
      function reduceLabels(acc, l) {
        acc[l] = getFieldName(compName, l);
        return acc;
      },
      { date: "", hr: "", min: "" },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Form.Field
      className={`${className || ""} datetime-field light-border`}
      id={`datetime-field-input-${compName}`}
    >
      <DateField
        name={fieldNames.date}
        value={datetime}
        setValue={setDateVal}
      />

      <div className="datetime-field-time">
        <div>
          <label className="field_label">Hour</label>

          <Dropdown
            fluid={true}
            selection={true}
            compact={true}
            id={`datetime-hour-field-${fieldNames.hr}`}
            name={fieldNames.hr}
            options={HOUR_OPTIONS}
            defaultValue={datetime.getHours()}
            onChange={function dropDownHrChanged(evt, data) {
              setDateTimeVal({ h: data.value as number });
            }}
          />
        </div>

        <div>
          <label className="field_label">Minute</label>
          <Dropdown
            fluid={true}
            selection={true}
            compact={true}
            id={`datetime-minute-field-${fieldNames.min}`}
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

export function getFieldName(compName: string, field: string) {
  return compName + "." + field;
}
