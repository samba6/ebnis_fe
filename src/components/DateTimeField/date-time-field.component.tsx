import React, { useState, useMemo } from "react";
import Dropdown from "../Dropdown/dropdown-component";
import { DateField } from "../DateField/date-field.component";
import { FormObjVal } from "../Experience/experience.utils";
import { Props } from "./date-time-field.utils";
import "../DateField/date-field.styles.css";
import {
  selectedItemClassName,
  makeHourItemSelector,
  makeMinuteItemSelector,
} from "../DateField/date-field.dom";

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
        <span className={`text ${makeHourItemSelector(text)}`}>{text}</span>
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
        <span className={`text ${makeMinuteItemSelector(text)}`}>{text}</span>
      ),
    };
  },
);

export function DateTimeField(props: Props) {
  const { className, name: compName, onChange, value } = props;
  const [datetime, setDatetime] = useState(value);

  function setDateVal(_: string, date: FormObjVal) {
    const date1 = date as Date;
    setDateTimeVal({}, date1);
  }

  function setDateTimeVal(
    { h = datetime.getHours(), m = datetime.getMinutes() },
    date = datetime,
  ) {
    date = new Date(date);
    date.setHours(h);
    date.setMinutes(m);
    setDatetime(date);
    onChange(compName, date);
  }

  const fieldNames = useMemo(function getFieldNames() {
    return ["date", "hr", "min"].reduce(
      function reduceLabels(acc, l) {
        acc[l] = getFieldName(compName, l);
        return acc;
      },
      {} as {
        date: string;
        hr: string;
        min: string;
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`${className || ""} datetime-field light-border`}
      id={`datetime-field-input-${compName}`}
    >
      <DateField
        name={fieldNames.date}
        value={datetime}
        onChange={setDateVal}
        className="datetime-field__date"
      />

      <div className="datetime-field__time">
        <div className="datetime-field__hour">
          <label className="field_label">Hour</label>

          <Dropdown
            selectedItemClassName={selectedItemClassName}
            id={`datetime-hour-field-${fieldNames.hr}`}
            options={HOUR_OPTIONS}
            defaultValue={datetime.getHours()}
            onChange={function dropDownHrChanged(_, data) {
              setDateTimeVal({ h: data as number });
            }}
          />
        </div>

        <div>
          <label className="field_label">Minute</label>

          <Dropdown
            selectedItemClassName={selectedItemClassName}
            id={`datetime-minute-field-${fieldNames.min}`}
            options={MINUTE_OPTIONS}
            defaultValue={datetime.getMinutes()}
            onChange={function dropDownMinChanged(_, data) {
              setDateTimeVal({ m: data as number });
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function getFieldName(compName: string, field: string) {
  return compName + "." + field;
}
